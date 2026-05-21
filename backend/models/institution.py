from backend.config.db import db


class Institution(db.Model):

    __tablename__ = "institutions"

    id = db.Column(db.Integer, primary_key=True)

    institution_name = db.Column(db.String(255))

    city = db.Column(db.String(255))

    state = db.Column(db.String(255))

    research_focus = db.Column(db.String(255))

    ranking = db.Column(db.Integer)