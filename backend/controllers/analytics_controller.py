from flask import Blueprint, jsonify
from flask_login import login_required

from backend.services.analytics_service import (
    get_dashboard_metrics,
    get_domain_distribution
)

analytics_bp = Blueprint(
    "analytics",
    __name__
)

@analytics_bp.route(
    "/api/analytics/dashboard",
    methods=["GET"]
)
@login_required
def dashboard_metrics():

    metrics = get_dashboard_metrics()

    return jsonify(metrics)


@analytics_bp.route(
    "/api/analytics/domains",
    methods=["GET"]
)
@login_required
def domain_distribution():

    data = get_domain_distribution()

    return jsonify(data)