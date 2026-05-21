from backend.models.ipr import IPRRecord
from backend.config.db import db
from sqlalchemy import func

ALLOWED_IPR_STATUSES = {
    "Pending",
    "Under Review",
    "Approved",
    "Rejected"
}


def _normalize_status(value):

    status = (value or "").strip()
    lookup = {item.lower(): item for item in ALLOWED_IPR_STATUSES}
    normalized = lookup.get(status.lower())
    if not normalized:
        raise ValueError("Invalid approval status")
    return normalized

def create_ipr(data):

    payload = data or {}

    ipr = IPRRecord(
        patent_title=(payload.get("patent_title") or "").strip(),
        applicant_name=(payload.get("applicant_name") or "").strip(),
        patent_type=(payload.get("patent_type") or "").strip(),
        approval_status=_normalize_status(
            payload.get("approval_status") or "Pending"
        )
    )

    db.session.add(ipr)
    db.session.commit()

    return ipr


def get_all_ipr():

    return IPRRecord.query.order_by(
        IPRRecord.application_date.desc(),
        IPRRecord.id.desc()
    ).all()


def update_ipr_status(ipr_id, approval_status):

    record = IPRRecord.query.get(ipr_id)

    if not record:
        return None

    record.approval_status = _normalize_status(approval_status)
    db.session.commit()

    return record


def get_ipr_analytics():

    status_rows = db.session.query(
        IPRRecord.approval_status,
        func.count(IPRRecord.id)
    ).group_by(IPRRecord.approval_status).all()

    type_rows = db.session.query(
        IPRRecord.patent_type,
        func.count(IPRRecord.id)
    ).group_by(IPRRecord.patent_type).all()

    total = IPRRecord.query.count()
    approved = IPRRecord.query.filter_by(approval_status="Approved").count()
    pending = IPRRecord.query.filter_by(approval_status="Pending").count()
    review = IPRRecord.query.filter_by(approval_status="Under Review").count()
    rejected = IPRRecord.query.filter_by(approval_status="Rejected").count()

    approval_rate = round((approved / total) * 100) if total else 0

    return {
        "total": total,
        "approval_rate": approval_rate,
        "status_breakdown": {
            "labels": [status or "Unspecified" for status, _ in status_rows],
            "values": [count for _, count in status_rows]
        },
        "type_breakdown": {
            "labels": [patent_type or "Unspecified" for patent_type, _ in type_rows],
            "values": [count for _, count in type_rows]
        },
        "counters": {
            "approved": approved,
            "pending": pending,
            "under_review": review,
            "rejected": rejected
        }
    }
