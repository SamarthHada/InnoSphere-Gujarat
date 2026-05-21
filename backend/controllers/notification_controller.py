from flask import Blueprint, jsonify
from flask_login import login_required

from backend.services.notification_service import (
    fetch_notifications
)

notification_bp = Blueprint(
    "notifications",
    __name__
)

@notification_bp.route(
    "/api/notifications",
    methods=["GET"]
)
@login_required
def notifications():

    notifications = fetch_notifications()

    notification_list = []

    for item in notifications:

        notification_list.append({
            "message": item.message,
            "type": item.notification_type,
            "created_at": item.created_at
        })

    return jsonify(notification_list)