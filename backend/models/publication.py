from backend.config.db import db


class Publication(db.Model):

    __tablename__ = "publications"

    id = db.Column(db.Integer, primary_key=True)

    paper_title = db.Column(db.String(255))

    author_name = db.Column(db.String(255))

    journal_name = db.Column(db.String(255))

    citations = db.Column(db.Integer)

    domain = db.Column(db.String(255))