"""Template and template-step endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import db_session
from app.models import Run, RunStep, StepFieldDef, Template, TemplateStep
from app.schemas import runs as run_schema
from app.schemas import templates as template_schema
from app.services.run_loader import load_run_detail


router = APIRouter(tags=["templates"])


def _safe_commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        _handle_integrity_error(exc)


def _handle_integrity_error(exc: IntegrityError) -> None:
    message = str(getattr(exc, "orig", exc)).lower()
    constraint = getattr(getattr(exc, "orig", None), "diag", None)
    constraint_name = getattr(constraint, "constraint_name", "") if constraint else ""

    if "template_step_order_unique" in constraint_name or (
        "template_steps" in message and "order_index" in message
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order index already used for this template",
        )

    if "step_field_unique_name" in constraint_name or (
        "step_field_defs" in message and "name" in message
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Field name already exists for this step",
        )

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Integrity violation")


def _template_query_with_children() -> select:
    return (
        select(Template)
        .options(
            selectinload(Template.steps)
            .selectinload(TemplateStep.field_defs)
        )
        .order_by(Template.id)
    )


@router.get("/templates", response_model=list[template_schema.TemplateRead])
def list_templates(db: Session = Depends(db_session)):
    templates = db.execute(_template_query_with_children()).unique().scalars().all()
    return templates


@router.post("/templates", response_model=template_schema.TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(payload: template_schema.TemplateCreate, db: Session = Depends(db_session)):
    template = Template(**payload.model_dump())
    db.add(template)
    db.commit()
    return _get_template_or_404(template.id, db)


def _get_template_or_404(template_id: int, db: Session) -> Template:
    template = (
        db.execute(
            _template_query_with_children().where(Template.id == template_id)
        )
        .unique()
        .scalars()
        .first()
    )
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.get("/templates/{template_id}", response_model=template_schema.TemplateRead)
def get_template(template_id: int, db: Session = Depends(db_session)):
    return _get_template_or_404(template_id, db)


@router.patch("/templates/{template_id}", response_model=template_schema.TemplateRead)
def update_template(
    template_id: int, payload: template_schema.TemplateUpdate, db: Session = Depends(db_session)
):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return _get_template_or_404(template_id, db)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: int, db: Session = Depends(db_session)):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    db.delete(template)
    db.commit()


@router.post(
    "/templates/{template_id}/steps",
    response_model=template_schema.TemplateStepRead,
    status_code=status.HTTP_201_CREATED,
)
def create_step(
    template_id: int,
    payload: template_schema.TemplateStepCreate,
    db: Session = Depends(db_session),
):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    data = payload.model_dump(exclude_unset=True)
    if data.get("order_index") is None:
        max_order = db.scalar(
            select(func.max(TemplateStep.order_index)).where(TemplateStep.template_id == template_id)
        )
        data["order_index"] = (max_order or 0) + 1

    step = TemplateStep(template_id=template_id, **data)
    db.add(step)
    _safe_commit(db)
    db.refresh(step)
    return step


@router.patch("/template-steps/{step_id}", response_model=template_schema.TemplateStepRead)
def update_step(
    step_id: int, payload: template_schema.TemplateStepUpdate, db: Session = Depends(db_session)
):
    step = db.get(TemplateStep, step_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(step, field, value)
    _safe_commit(db)
    db.refresh(step)
    return step


@router.delete("/template-steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step(step_id: int, db: Session = Depends(db_session)):
    step = db.get(TemplateStep, step_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    db.delete(step)
    db.commit()


@router.post(
    "/template-steps/{step_id}/fields",
    response_model=template_schema.StepFieldDefRead,
    status_code=status.HTTP_201_CREATED,
)
def create_step_field(
    step_id: int,
    payload: template_schema.StepFieldDefCreate,
    db: Session = Depends(db_session),
):
    step = db.get(TemplateStep, step_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    field = StepFieldDef(template_step_id=step_id, **payload.model_dump())
    db.add(field)
    _safe_commit(db)
    db.refresh(field)
    return field


@router.patch("/step-fields/{field_id}", response_model=template_schema.StepFieldDefRead)
def update_step_field(
    field_id: int,
    payload: template_schema.StepFieldDefUpdate,
    db: Session = Depends(db_session),
):
    field_def = db.get(StepFieldDef, field_id)
    if not field_def:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(field_def, field, value)
    _safe_commit(db)
    db.refresh(field_def)
    return field_def


@router.delete("/step-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step_field(field_id: int, db: Session = Depends(db_session)):
    field_def = db.get(StepFieldDef, field_id)
    if not field_def:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")
    db.delete(field_def)
    db.commit()


@router.post(
    "/templates/{template_id}/runs",
    response_model=run_schema.RunDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_run_from_template(
    template_id: int,
    payload: run_schema.RunCreate,
    db: Session = Depends(db_session),
):
    template = (
        db.execute(
            select(Template).options(selectinload(Template.steps)).where(Template.id == template_id)
        )
        .scalars()
        .first()
    )
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    run = Run(template_id=template_id, **payload.model_dump())
    db.add(run)
    db.flush()

    for step in template.steps:
        db.add(
            RunStep(
                run_id=run.id,
                template_step_id=step.id,
                order_index=step.order_index,
            )
        )

    db.commit()
    return load_run_detail(db, run.id)
