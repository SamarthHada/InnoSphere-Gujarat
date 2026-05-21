from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from backend.services.project_service import (
    create_project,
    get_all_projects
)

from backend.services.search_service import (
    search_projects,
    filter_projects_by_domain
)

research_bp = Blueprint(
    "research",
    __name__
)


@research_bp.route(
    "/api/projects/submit",
    methods=["POST"]
)
@login_required
def submit_project():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid project payload"
        }), 400

    title = (data.get("title") or data.get("project_title") or "").strip()
    domain = (data.get("domain") or "").strip()

    if not title:
        return jsonify({
            "error": "Project title is required"
        }), 400

    if not domain:
        return jsonify({
            "error": "Project domain is required"
        }), 400

    payload = dict(data)
    payload.setdefault("researcher", getattr(current_user, "full_name", "") or current_user.email)

    project = create_project(
        payload,
        current_user.id
    )

    return jsonify({
        "message": "Project submitted successfully",
        "project_id": project.id
    })


@research_bp.route(
    "/api/projects",
    methods=["GET"]
)
@login_required
def fetch_projects():

    projects = get_all_projects()

    project_list = []

    for project in projects:

        project_list.append({
            "id": project.id,
            "title": project.title,
            "domain": project.domain,
            "status": project.status,
            "funding": project.funding
        })

    return jsonify(project_list)


@research_bp.route(
    "/api/projects/search",
    methods=["GET"]
)
@login_required
def search():

    keyword = request.args.get("keyword")

    projects = search_projects(keyword)

    result = []

    for project in projects:

        result.append({
            "id": project.id,
            "title": project.title,
            "domain": project.domain,
            "status": project.status
        })

    return jsonify(result)


@research_bp.route(
    "/api/projects/filter/domain",
    methods=["GET"]
)
@login_required
def filter_domain():

    domain = request.args.get("domain")

    projects = filter_projects_by_domain(
        domain
    )

    result = []

    for project in projects:

        result.append({
            "id": project.id,
            "title": project.title,
            "status": project.status
        })

    return jsonify(result)
