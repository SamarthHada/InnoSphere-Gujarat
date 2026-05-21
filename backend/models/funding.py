from backend.config.db import db


class Funding(db.Model):

    __tablename__ = "funding_records"

    id = db.Column(db.Integer, primary_key=True)

    funding_source = db.Column(db.String(255))

    amount = db.Column(db.Float)

    funding_status = db.Column(db.String(100))