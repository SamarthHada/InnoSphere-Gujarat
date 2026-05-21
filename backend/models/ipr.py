from backend.config.db import db

class IPRRecord(db.Model):
    __tablename__ = "ipr_records"

    id = db.Column(db.Integer, primary_key=True)

    patent_title = db.Column(
        db.String(255),
        nullable=False
    )

    applicant_name = db.Column(
        db.String(120),
        nullable=False
    )

    patent_type = db.Column(db.String(100))

    approval_status = db.Column(
        db.String(50),
        default="Pending"
    )

    application_date = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )