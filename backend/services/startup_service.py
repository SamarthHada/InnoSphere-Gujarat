from backend.models.startup import Startup
from backend.config.db import db


def _coerce_float(value):

    if value in (None, ""):
        return None

    return float(value)


def _coerce_int(value):

    if value in (None, ""):
        return None

    return int(value)


def register_startup(data):

    payload = data or {}

    startup = Startup(
        startup_name=(payload.get("startup_name") or "").strip(),
        founder_name=(payload.get("founder_name") or "").strip(),
        sector=(payload.get("sector") or "").strip(),
        funding_stage=(payload.get("funding_stage") or "").strip(),
        funding_received=_coerce_float(payload.get("funding_received")),
        employee_count=_coerce_int(payload.get("employee_count")),
        incubation_status=(payload.get("incubation_status") or "").strip(),
        city=(payload.get("city") or "").strip(),
        status=(payload.get("status") or "Active").strip()
    )

    db.session.add(startup)
    db.session.commit()

    return startup


def fetch_startups():

    return Startup.query.all()


def startup_sector_distribution():

    results = db.session.query(
        Startup.sector,
        db.func.count(Startup.id)
    ).group_by(Startup.sector).all()

    labels = []
    values = []

    for sector, count in results:
        labels.append(sector or "Unspecified")
        values.append(count)

    return {
        "labels": labels,
        "values": values
    }
