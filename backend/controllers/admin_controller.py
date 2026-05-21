from flask import Blueprint, jsonify
from flask_login import login_required

from backend.services.project_service import (
    approve_project
)
from backend.services.analytics_service import get_admin_overview

admin_bp = Blueprint(
    "admin",
    __name__
)

@admin_bp.route(
    "/api/admin/approve/<int:project_id>",
    methods=["PUT"]
)
@login_required
def approve(project_id):

    project = approve_project(project_id)

    if not project:
        return jsonify({
            "error": "Project not found"
        }), 404

    return jsonify({
        "message": "Project approved"
    })


@admin_bp.route(
    "/api/admin/overview",
    methods=["GET"]
)
@login_required
def overview():

    return jsonify(get_admin_overview())
