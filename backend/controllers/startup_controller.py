from flask import Blueprint, request, jsonify
from flask_login import login_required
from sqlalchemy.exc import SQLAlchemyError

from backend.services.startup_service import (
    register_startup,
    fetch_startups,
    startup_sector_distribution
)

startup_bp = Blueprint(
    "startup",
    __name__
)

@startup_bp.route(
    "/api/startups/register",
    methods=["POST"]
)
@login_required
def create_startup():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid startup payload"
        }), 400

    if not (data.get("startup_name") or "").strip():
        return jsonify({
            "error": "Startup name is required"
        }), 400

    if not (data.get("founder_name") or "").strip():
        return jsonify({
            "error": "Founder name is required"
        }), 400

    if not (data.get("sector") or "").strip():
        return jsonify({
            "error": "Sector is required"
        }), 400

    try:
        startup = register_startup(data)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Funding received and employee count must be numeric values"
        }), 400
    except SQLAlchemyError:
        return jsonify({
            "error": "Unable to register startup"
        }), 500

    return jsonify({
        "message": "Startup registered successfully",
        "startup_id": startup.id
    }), 201


@startup_bp.route(
    "/api/startups",
    methods=["GET"]
)
@login_required
def get_startups():

    startups = fetch_startups()

    startup_list = []

    for startup in startups:

        startup_list.append({
            "id": startup.id,
            "startup_name": startup.startup_name,
            "founder_name": startup.founder_name,
            "sector": startup.sector,
            "funding_stage": startup.funding_stage,
            "funding_received": startup.funding_received,
            "employee_count": startup.employee_count,
            "incubation_status": startup.incubation_status,
            "city": startup.city,
            "status": startup.status,
            "registration_date": (
                startup.registration_date.isoformat()
                if startup.registration_date
                else None
            )
        })

    return jsonify(startup_list)


@startup_bp.route(
    "/api/startups/analytics/sectors",
    methods=["GET"]
)
@login_required
def startup_analytics():

    data = startup_sector_distribution()

    return jsonify(data)
