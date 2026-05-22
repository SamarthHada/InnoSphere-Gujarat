from pathlib import Path

import pandas as pd

from backend.config.db import db
from backend.models.activity_log import ActivityLog
from backend.models.collaboration import Collaboration
from backend.models.evaluation import Evaluation
from backend.models.funding import Funding
from backend.models.institution import Institution
from backend.models.ipr import IPRRecord
from backend.models.notification import Notification
from backend.models.project import Project
from backend.models.publication import Publication
from backend.models.startup import Startup
from backend.models.user import User


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
DEFAULT_PASSWORD = "password123"


def seed_demo_data(data_dir: Path | None = None) -> dict[str, int]:
    base_dir = Path(data_dir) if data_dir else DATA_DIR

    if not base_dir.exists():
        return {}

    counts: dict[str, int] = {}

    projects_df = pd.read_csv(base_dir / "projects.csv")
    for _, row in projects_df.iterrows():
        db.session.add(
            Project(
                title=row.get("title"),
                domain=row.get("domain"),
                researcher=row.get("researcher"),
                funding=row.get("funding_required", 0),
                status=row.get("status"),
                description=row.get("description"),
            )
        )
    counts["projects"] = len(projects_df)

    startups_df = pd.read_csv(base_dir / "startups.csv")
    for _, row in startups_df.iterrows():
        registration_date = pd.to_datetime(
            row.get("registration_date"), errors="coerce"
        )

        db.session.add(
            Startup(
                startup_name=row.get("startup_name"),
                founder_name=row.get("founder_name"),
                sector=row.get("sector"),
                funding_stage=row.get("funding_stage"),
                funding_received=row.get("funding_received", 0),
                employee_count=row.get("employee_count"),
                incubation_status=row.get("incubation_status"),
                city=row.get("city"),
                registration_date=(
                    registration_date.to_pydatetime()
                    if pd.notna(registration_date)
                    else None
                ),
                status=row.get("status"),
            )
        )
    counts["startups"] = len(startups_df)

    users_df = pd.read_csv(base_dir / "users.csv")
    for _, row in users_df.iterrows():
        user = User(
            full_name=row.get("full_name"),
            email=row.get("email"),
            role=row.get("role"),
            institution=row.get("institution"),
            account_status=row.get("account_status"),
        )
        user.set_password(DEFAULT_PASSWORD)
        db.session.add(user)
    counts["users"] = len(users_df)

    ipr_df = pd.read_csv(base_dir / "ipr_records.csv")
    for _, row in ipr_df.iterrows():
        db.session.add(
            IPRRecord(
                patent_title=row.get("patent_title"),
                applicant_name=row.get("applicant_name"),
                patent_type=row.get("patent_type"),
                approval_status=row.get("approval_status"),
            )
        )
    counts["ipr_records"] = len(ipr_df)

    notifications_df = pd.read_csv(base_dir / "notifications.csv")
    for _, row in notifications_df.iterrows():
        db.session.add(
            Notification(
                message=row.get("message"),
                recipient_email=row.get("recipient_email"),
                notification_type=row.get("notification_category"),
            )
        )
    counts["notifications"] = len(notifications_df)

    funding_df = pd.read_csv(base_dir / "funding_records.csv")
    for _, row in funding_df.iterrows():
        db.session.add(
            Funding(
                funding_source=row.get("funding_source"),
                amount=row.get("amount", 0),
                funding_status=row.get("funding_status"),
            )
        )
    counts["funding_records"] = len(funding_df)

    publications_df = pd.read_csv(base_dir / "research_publications.csv")
    for _, row in publications_df.iterrows():
        db.session.add(
            Publication(
                paper_title=row.get("paper_title"),
                author_name=row.get("author_name"),
                journal_name=row.get("journal_name"),
                citations=row.get("citations", 0),
                domain=row.get("domain"),
            )
        )
    counts["publications"] = len(publications_df)

    evaluations_df = pd.read_csv(base_dir / "evaluations.csv")
    for _, row in evaluations_df.iterrows():
        db.session.add(
            Evaluation(
                evaluator_name=row.get("evaluator_name"),
                score=row.get("score", 0),
                status=row.get("status"),
                remarks=row.get("remarks"),
            )
        )
    counts["evaluations"] = len(evaluations_df)

    institutions_df = pd.read_csv(base_dir / "institutions.csv")
    for _, row in institutions_df.iterrows():
        db.session.add(
            Institution(
                institution_name=row.get("institution_name"),
                city=row.get("city"),
                state=row.get("state"),
                research_focus=row.get("research_focus"),
                ranking=row.get("ranking", 0),
            )
        )
    counts["institutions"] = len(institutions_df)

    logs_df = pd.read_csv(base_dir / "activity_logs.csv")
    for _, row in logs_df.iterrows():
        db.session.add(
            ActivityLog(
                user_id=row.get("user_id", 0),
                activity_type=row.get("activity_type"),
                module=row.get("module"),
                status=row.get("status"),
            )
        )
    counts["activity_logs"] = len(logs_df)

    collaborations_df = pd.read_csv(base_dir / "collaborations.csv")
    for _, row in collaborations_df.iterrows():
        db.session.add(
            Collaboration(
                institution_1=row.get("institution_1"),
                institution_2=row.get("institution_2"),
                project_title=row.get("project_title"),
                domain=row.get("domain"),
                status=row.get("status"),
            )
        )
    counts["collaborations"] = len(collaborations_df)

    db.session.commit()
    return counts
