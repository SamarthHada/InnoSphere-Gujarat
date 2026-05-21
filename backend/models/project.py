from backend.config.db import db


class Project(db.Model):

    __tablename__ = "projects"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    domain = db.Column(
        db.String(255)
    )

    researcher = db.Column(
        db.String(255)
    )

    funding = db.Column(
        db.Float
    )

    status = db.Column(
        db.String(100)
    )

    description = db.Column(
        db.Text
    )