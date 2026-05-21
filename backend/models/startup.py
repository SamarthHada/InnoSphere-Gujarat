from backend.config.db import db

class Startup(db.Model):
    __tablename__ = "startups"

    id = db.Column(db.Integer, primary_key=True)

    startup_name = db.Column(
        db.String(150),
        nullable=False
    )

    founder_name = db.Column(
        db.String(120),
        nullable=False
    )

    sector = db.Column(db.String(120))

    funding_stage = db.Column(db.String(100))

    funding_received = db.Column(db.Float)

    employee_count = db.Column(db.Integer)

    incubation_status = db.Column(db.String(100))

    city = db.Column(db.String(100))

    registration_date = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    status = db.Column(
        db.String(50),
        default="Active"
    )