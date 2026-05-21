from flask import Blueprint, jsonify
from flask_login import login_required

from backend.services.report_service import (
    export_projects_csv
)

report_bp = Blueprint(
    "reports",
    __name__
)

@report_bp.route(
    "/api/reports/projects",
    methods=["GET"]
)
@login_required
def generate_report():

    filepath = export_projects_csv()

    return jsonify({
        "message": "Report generated",
        "path": filepath
    })