from backend.config.db import db


class Evaluation(db.Model):

    __tablename__ = "evaluations"

    id = db.Column(db.Integer, primary_key=True)

    evaluator_name = db.Column(db.String(255))

    score = db.Column(db.Integer)

    status = db.Column(db.String(100))

    remarks = db.Column(db.Text)