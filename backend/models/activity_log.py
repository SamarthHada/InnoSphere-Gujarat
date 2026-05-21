from backend.config.db import db


class ActivityLog(db.Model):

    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer)

    activity_type = db.Column(db.String(255))

    module = db.Column(db.String(255))

    status = db.Column(db.String(100))