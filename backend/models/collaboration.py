from backend.config.db import db


class Collaboration(db.Model):

    __tablename__ = "collaborations"

    id = db.Column(db.Integer, primary_key=True)

    institution_1 = db.Column(db.String(255))

    institution_2 = db.Column(db.String(255))

    project_title = db.Column(db.String(255))

    domain = db.Column(db.String(255))

    status = db.Column(db.String(100))