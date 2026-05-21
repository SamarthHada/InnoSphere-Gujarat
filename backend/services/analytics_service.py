from backend.models.project import Project
from backend.models.startup import Startup
from backend.models.ipr import IPRRecord
from backend.models.notification import Notification
from backend.models.activity_log import ActivityLog
from backend.models.user import User

from backend.config.db import db
from sqlalchemy import func

def get_dashboard_metrics():

    total_projects = Project.query.count()

    approved_projects = Project.query.filter_by(
        status="Approved"
    ).count()

    total_startups = Startup.query.count()

    total_ipr = IPRRecord.query.count()

    return {
        "total_projects": total_projects,
        "approved_projects": approved_projects,
        "total_startups": total_startups,
        "total_ipr": total_ipr
    }


def get_domain_distribution():

    results = db.session.query(
        Project.domain,
        db.func.count(Project.id)
    ).group_by(Project.domain).all()

    labels = []
    values = []

    for domain, count in results:
        labels.append(domain)
        values.append(count)

    return {
        "labels": labels,
        "values": values
    }


def get_admin_overview():

    total_projects = Project.query.count()
    approved_projects = Project.query.filter_by(status="Approved").count()
    pending_projects = Project.query.filter_by(status="Pending").count()
    total_startups = Startup.query.count()
    active_startups = Startup.query.filter(
        func.lower(Startup.status) == "active"
    ).count()
    total_ipr = IPRRecord.query.count()
    approved_ipr = IPRRecord.query.filter_by(approval_status="Approved").count()
    pending_ipr = IPRRecord.query.filter_by(approval_status="Pending").count()
    total_users = User.query.count()
    total_notifications = Notification.query.count()

    project_status_rows = db.session.query(
        Project.status,
        func.count(Project.id)
    ).group_by(Project.status).all()

    startup_sector_rows = db.session.query(
        Startup.sector,
        func.count(Startup.id)
    ).group_by(Startup.sector).all()

    ipr_status_rows = db.session.query(
        IPRRecord.approval_status,
        func.count(IPRRecord.id)
    ).group_by(IPRRecord.approval_status).all()

    activity_rows = ActivityLog.query.order_by(
        ActivityLog.id.desc()
    ).limit(8).all()

    notification_rows = Notification.query.order_by(
        Notification.created_at.desc()
    ).limit(5).all()

    return {
        "metrics": {
            "total_projects": total_projects,
            "approved_projects": approved_projects,
            "pending_projects": pending_projects,
            "total_startups": total_startups,
            "active_startups": active_startups,
            "total_ipr": total_ipr,
            "approved_ipr": approved_ipr,
            "pending_ipr": pending_ipr,
            "total_users": total_users,
            "total_notifications": total_notifications
        },
        "health": [
            {
                "label": "Database",
                "value": "Connected",
                "detail": f"{total_projects + total_startups + total_ipr} records available",
                "tone": "success"
            },
            {
                "label": "Research queue",
                "value": f"{pending_projects} pending",
                "detail": f"{approved_projects} approved projects ready for review",
                "tone": "warning"
            },
            {
                "label": "Startup load",
                "value": f"{active_startups} active",
                "detail": f"{total_startups} total startup records tracked",
                "tone": "info"
            },
            {
                "label": "IPR queue",
                "value": f"{pending_ipr} pending",
                "detail": f"{approved_ipr} approved records in circulation",
                "tone": "accent"
            }
        ],
        "charts": {
            "project_status": {
                "labels": [status or "Unspecified" for status, _ in project_status_rows],
                "values": [count for _, count in project_status_rows]
            },
            "startup_sector": {
                "labels": [sector or "Unspecified" for sector, _ in startup_sector_rows],
                "values": [count for _, count in startup_sector_rows]
            },
            "ipr_status": {
                "labels": [status or "Unspecified" for status, _ in ipr_status_rows],
                "values": [count for _, count in ipr_status_rows]
            }
        },
        "activity": [
            {
                "id": row.id,
                "user_id": row.user_id,
                "activity_type": row.activity_type,
                "module": row.module,
                "status": row.status
            }
            for row in activity_rows
        ],
        "notifications": [
            {
                "id": note.id,
                "message": note.message,
                "type": note.notification_type,
                "created_at": (
                    note.created_at.isoformat()
                    if note.created_at
                    else None
                )
            }
            for note in notification_rows
        ]
    }
