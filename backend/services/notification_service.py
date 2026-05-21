from backend.models.notification import Notification
from backend.config.db import db

def create_notification(message, recipient, notification_type):

    notification = Notification(
        message=message,
        recipient_email=recipient,
        notification_type=notification_type
    )

    db.session.add(notification)
    db.session.commit()

    return notification


def fetch_notifications():

    return Notification.query.order_by(
        Notification.created_at.desc()
    ).all()