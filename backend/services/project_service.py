from backend.models.project import Project
from backend.config.db import db

def create_project(data, researcher_id):
    payload = data or {}

    title = (payload.get("title") or payload.get("project_title") or "").strip()
    domain = (payload.get("domain") or "").strip()
    researcher = (
        payload.get("researcher")
        or payload.get("researcher_name")
        or payload.get("lead_researcher")
        or str(researcher_id or "")
    ).strip()
    description = (
        payload.get("description")
        or payload.get("abstract")
        or ""
    ).strip()

    funding_value = (
        payload.get("funding")
        if payload.get("funding") not in (None, "")
        else payload.get("funding_required")
    )

    try:
        funding = float(funding_value) if funding_value not in (None, "") else None
    except (TypeError, ValueError):
        funding = None

    status = (payload.get("status") or "Pending").strip() or "Pending"

    project = Project(
        title=title,
        domain=domain,
        researcher=researcher,
        funding=funding,
        status=status,
        description=description
    )

    db.session.add(project)
    db.session.commit()

    return project


def get_all_projects():

    return Project.query.all()


def approve_project(project_id):

    project = Project.query.get(project_id)

    if not project:
        return None

    project.status = "Approved"

    db.session.commit()

    return project
