"""Run and run-step endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import db_session
from app.models import Run, RunStep, StepFieldDef, StepFieldValue, TemplateStep
from app.schemas import runs as schema
from app.services.run_loader import load_run_detail, load_runs


router = APIRouter(prefix="/runs", tags=["runs"])


def _get_run_or_404(run_id: int, db: Session) -> Run:
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


def _get_run_step_or_404(run_step_id: int, db: Session) -> RunStep:
    run_step = (
        db.execute(
            select(RunStep)
            .options(
                selectinload(RunStep.template_step).selectinload(TemplateStep.field_defs),
                selectinload(RunStep.field_values),
            )
            .where(RunStep.id == run_step_id)
        )
        .scalars()
        .first()
    )
    if not run_step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run step not found")
    return run_step


@router.get("", response_model=list[schema.RunWithTemplate])
def list_runs(
    template_id: int | None = None,
    status_filter: Annotated[
        str | None, Query(alias="status", pattern=schema.STATUS_REGEX)
    ] = None,
    db: Session = Depends(db_session),
):
    filters = []
    if template_id is not None:
        filters.append(Run.template_id == template_id)
    if status_filter is not None:
        filters.append(Run.status == status_filter)
    return load_runs(db, *filters)


@router.get("/{run_id}", response_model=schema.RunDetail)
def get_run(run_id: int, db: Session = Depends(db_session)):
    run = load_run_detail(db, run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


@router.patch("/{run_id}", response_model=schema.RunDetail)
def update_run(run_id: int, payload: schema.RunUpdate, db: Session = Depends(db_session)):
    run = _get_run_or_404(run_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(run, field, value)
    db.commit()
    return get_run(run_id, db)


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_run(run_id: int, db: Session = Depends(db_session)):
    run = _get_run_or_404(run_id, db)
    db.delete(run)
    db.commit()


@router.patch("/{run_id}/steps/{run_step_id}", response_model=schema.RunStepRead)
def update_run_step(
    run_id: int,
    run_step_id: int,
    payload: schema.RunStepUpdate,
    db: Session = Depends(db_session),
):
    run_step = _get_run_step_or_404(run_step_id, db)
    if run_step.run_id != run_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not in run")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(run_step, field, value)

    if updates.get("status") == "done" and not updates.get("completed_at") and not run_step.completed_at:
        run_step.completed_at = datetime.utcnow()

    db.commit()
    return _get_run_step_or_404(run_step_id, db)


@router.post(
    "/{run_id}/steps/{run_step_id}/fields",
    response_model=schema.RunStepRead,
)
def upsert_field_values(
    run_id: int,
    run_step_id: int,
    payload: schema.FieldValueUpsertRequest,
    db: Session = Depends(db_session),
):
    run_step = _get_run_step_or_404(run_step_id, db)
    if run_step.run_id != run_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not in run")

    for item in payload.values:
        field_def = db.get(StepFieldDef, item.field_def_id)
        if not field_def or field_def.template_step_id != run_step.template_step_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid field")
        existing = (
            db.execute(
                select(StepFieldValue).where(
                    StepFieldValue.run_step_id == run_step_id,
                    StepFieldValue.field_def_id == item.field_def_id,
                )
            )
            .scalars()
            .first()
        )
        if existing:
            existing.value = item.value
        else:
            db.add(
                StepFieldValue(
                    run_step_id=run_step_id,
                    field_def_id=item.field_def_id,
                    value=item.value,
                )
            )

    db.commit()
    return _get_run_step_or_404(run_step_id, db)
