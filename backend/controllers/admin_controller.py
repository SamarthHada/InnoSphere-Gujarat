from functools import wraps

from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from backend.services.project_service import (
    approve_project
)
from backend.services.analytics_service import get_admin_overview

admin_bp = Blueprint(
    "admin",
    __name__
)


def is_admin_user():
    return (
        current_user.is_authenticated
        and str(getattr(current_user, "role", "")).strip().lower() == "admin"
    )


def admin_json_required(view):
    @wraps(view)
    @login_required
    def wrapper(*args, **kwargs):
        if not is_admin_user():
            return jsonify({
                "error": "Admin access required"
            }), 403

        return view(*args, **kwargs)

    return wrapper

@admin_bp.route(
    "/api/admin/approve/<int:project_id>",
    methods=["PUT"]
)
@admin_json_required
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
@admin_json_required
def overview():

    return jsonify(get_admin_overview())
