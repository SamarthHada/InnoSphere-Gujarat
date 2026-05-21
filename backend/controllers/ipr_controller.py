from flask import Blueprint, request, jsonify
from flask_login import login_required
from sqlalchemy.exc import SQLAlchemyError

from backend.services.ipr_service import (
    create_ipr,
    get_all_ipr,
    get_ipr_analytics,
    update_ipr_status
)

ipr_bp = Blueprint(
    "ipr",
    __name__
)

@ipr_bp.route(
    "/api/ipr/create",
    methods=["POST"]
)
@login_required
def register_ipr():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid IPR payload"
        }), 400

    if not (data.get("patent_title") or "").strip():
        return jsonify({
            "error": "Patent title is required"
        }), 400

    if not (data.get("applicant_name") or "").strip():
        return jsonify({
            "error": "Applicant name is required"
        }), 400

    if not (data.get("patent_type") or "").strip():
        return jsonify({
            "error": "Patent type is required"
        }), 400

    try:
        ipr = create_ipr(data)
    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400
    except SQLAlchemyError:
        return jsonify({
            "error": "Unable to create IPR application"
        }), 500

    return jsonify({
        "message": "IPR application submitted",
        "ipr_id": ipr.id
    }), 201


@ipr_bp.route(
    "/api/ipr",
    methods=["GET"]
)
@login_required
def fetch_ipr():

    records = get_all_ipr()

    ipr_list = []

    for record in records:

        ipr_list.append({
            "id": record.id,
            "patent_title": record.patent_title,
            "applicant_name": record.applicant_name,
            "approval_status": record.approval_status,
            "patent_type": record.patent_type,
            "application_date": (
                record.application_date.isoformat()
                if record.application_date
                else None
            )
        })

    return jsonify(ipr_list)


@ipr_bp.route(
    "/api/ipr/analytics",
    methods=["GET"]
)
@login_required
def fetch_ipr_analytics():

    return jsonify(get_ipr_analytics())


@ipr_bp.route(
    "/api/ipr/<int:ipr_id>/status",
    methods=["PATCH"]
)
@login_required
def change_ipr_status(ipr_id):

    data = request.get_json(silent=True) or {}
    approval_status = (data.get("approval_status") or "").strip()

    if not approval_status:
        return jsonify({
            "error": "Approval status is required"
        }), 400

    try:
        record = update_ipr_status(ipr_id, approval_status)
    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400
    except SQLAlchemyError:
        return jsonify({
            "error": "Unable to update IPR status"
        }), 500

    if not record:
        return jsonify({
            "error": "IPR record not found"
        }), 404

    return jsonify({
        "message": "IPR status updated",
        "ipr_id": record.id,
        "approval_status": record.approval_status
    })
