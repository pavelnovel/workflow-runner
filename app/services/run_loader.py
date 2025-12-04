"""Helper to load runs with related objects."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Run, RunStep, TemplateStep


from typing import Optional

def load_run_detail(db: Session, run_id: int) -> Optional[Run]:
    stmt = (
        select(Run)
        .options(
            selectinload(Run.template),
            selectinload(Run.steps)
            .selectinload(RunStep.template_step)
            .selectinload(TemplateStep.field_defs),
            selectinload(Run.steps).selectinload(RunStep.field_values),
        )
        .where(Run.id == run_id)
    )
    return db.execute(stmt).unique().scalars().first()


def load_runs(db: Session, *filters) -> list[Run]:
    stmt = (
        select(Run)
        .options(selectinload(Run.template))
        .order_by(Run.id)
    )
    for condition in filters:
        stmt = stmt.where(condition)
    return db.execute(stmt).unique().scalars().all()
