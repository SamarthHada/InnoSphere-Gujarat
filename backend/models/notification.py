from backend.config.db import db

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)

    message = db.Column(
        db.String(255),
        nullable=False
    )

    recipient_email = db.Column(
        db.String(120)
    )

    notification_type = db.Column(
        db.String(50)
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )