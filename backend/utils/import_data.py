import pandas as pd
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../.."
        )
    )
)
from app import app

from backend.config.db import db

from backend.models.project import Project
from backend.models.startup import Startup
from backend.models.user import User
from backend.models.ipr import IPRRecord
from backend.models.notification import Notification
from backend.models.funding import Funding
from backend.models.publication import Publication
from backend.models.evaluation import Evaluation
from backend.models.institution import Institution
from backend.models.activity_log import ActivityLog
from backend.models.collaboration import Collaboration


with app.app_context():

    print("Importing datasets...")


    # =========================
    # PROJECTS
    # =========================

    projects_df = pd.read_csv(
        "data/projects.csv"
    )

    for _, row in projects_df.iterrows():

        project = Project(

            title=row.get("title"),

            domain=row.get("domain"),

            researcher=row.get("researcher"),

            funding=row.get(
                "funding_required",
                0
            ),

            status=row.get("status"),

            description=row.get(
                "description"
            )
        )

        db.session.add(project)

    print("Projects imported")


    # =========================
    # STARTUPS
    # =========================

    startups_df = pd.read_csv(
        "data/startups.csv"
    )

    for _, row in startups_df.iterrows():

        startup_id = row.get("startup_id")
        registration_date = pd.to_datetime(
            row.get("registration_date"),
            errors="coerce"
        )

        startup = Startup(

            id=int(startup_id) if pd.notna(startup_id) else None,

            startup_name=row.get(
                "startup_name"
            ),

            founder_name=row.get(
                "founder_name"
            ),

            sector=row.get("sector"),

            funding_stage=row.get(
                "funding_stage"
            ),

            funding_received=row.get(
                "funding_received",
                0
            ),

            employee_count=row.get(
                "employee_count"
            ),

            incubation_status=row.get(
                "incubation_status"
            ),

            city=row.get("city"),

            registration_date=(
                registration_date.to_pydatetime()
                if pd.notna(registration_date)
                else None
            ),

            status=row.get("status")
        )

        db.session.add(startup)

    print("Startups imported")


    # =========================
    # USERS
    # =========================

    users_df = pd.read_csv(
        "data/users.csv"
    )

    for _, row in users_df.iterrows():

        user = User(

            full_name=row.get(
                "full_name"
            ),

            email=row.get("email"),

            role=row.get("role"),

            institution=row.get(
                "institution"
            ),

            account_status=row.get(
                "account_status"
            )
        )
        user.set_password("password123")
        db.session.add(user)

    print("Users imported")


    # =========================
    # IPR RECORDS
    # =========================

    ipr_df = pd.read_csv(
        "data/ipr_records.csv"
    )

    for _, row in ipr_df.iterrows():

        ipr = IPRRecord(

            patent_title=row.get(
                "patent_title"
            ),

            applicant_name=row.get(
                "applicant_name"
            ),

            patent_type=row.get(
                "patent_type"
            ),

            approval_status=row.get(
                "approval_status"
            )
        )

        db.session.add(ipr)

    print("IPR records imported")


    # =========================
    # NOTIFICATIONS
    # =========================

    notifications_df = pd.read_csv(
        "data/notifications.csv"
    )

    for _, row in notifications_df.iterrows():

        notification = Notification(

            message=row.get("message"),

            recipient_email=row.get(
                "recipient_email"
            ),

            notification_type=row.get(
                "notification_category"
            )
        )

        db.session.add(notification)

    print("Notifications imported")


    # =========================
    # FUNDING
    # =========================

    funding_df = pd.read_csv(
        "data/funding_records.csv"
    )

    for _, row in funding_df.iterrows():

        funding = Funding(

            funding_source=row.get(
                "funding_source"
            ),

            amount=row.get(
                "amount",
                0
            ),

            funding_status=row.get(
                "funding_status"
            )
        )

        db.session.add(funding)

    print("Funding records imported")


    # =========================
    # PUBLICATIONS
    # =========================

    publications_df = pd.read_csv(
        "data/research_publications.csv"
    )

    for _, row in publications_df.iterrows():

        publication = Publication(

            paper_title=row.get(
                "paper_title"
            ),

            author_name=row.get(
                "author_name"
            ),

            journal_name=row.get(
                "journal_name"
            ),

            citations=row.get(
                "citations",
                0
            ),

            domain=row.get("domain")
        )

        db.session.add(publication)

    print("Publications imported")


    # =========================
    # EVALUATIONS
    # =========================

    evaluations_df = pd.read_csv(
        "data/evaluations.csv"
    )

    for _, row in evaluations_df.iterrows():

        evaluation = Evaluation(

            evaluator_name=row.get(
                "evaluator_name"
            ),

            score=row.get(
                "score",
                0
            ),

            status=row.get("status"),

            remarks=row.get("remarks")
        )

        db.session.add(evaluation)

    print("Evaluations imported")


    # =========================
    # INSTITUTIONS
    # =========================

    institutions_df = pd.read_csv(
        "data/institutions.csv"
    )

    for _, row in institutions_df.iterrows():

        institution = Institution(

            institution_name=row.get(
                "institution_name"
            ),

            city=row.get("city"),

            state=row.get("state"),

            research_focus=row.get(
                "research_focus"
            ),

            ranking=row.get(
                "ranking",
                0
            )
        )

        db.session.add(institution)

    print("Institutions imported")


    # =========================
    # ACTIVITY LOGS
    # =========================

    logs_df = pd.read_csv(
        "data/activity_logs.csv"
    )

    for _, row in logs_df.iterrows():

        log = ActivityLog(

            user_id=row.get(
                "user_id",
                0
            ),

            activity_type=row.get(
                "activity_type"
            ),

            module=row.get("module"),

            status=row.get("status")
        )

        db.session.add(log)

    print("Activity logs imported")


    # =========================
    # COLLABORATIONS
    # =========================

    collaborations_df = pd.read_csv(
        "data/collaborations.csv"
    )

    for _, row in collaborations_df.iterrows():

        collaboration = Collaboration(

            institution_1=row.get(
                "institution_1"
            ),

            institution_2=row.get(
                "institution_2"
            ),

            project_title=row.get(
                "project_title"
            ),

            domain=row.get("domain"),

            status=row.get("status")
        )

        db.session.add(collaboration)

    print("Collaborations imported")


    # =========================
    # FINAL COMMIT
    # =========================

    db.session.commit()

    print("All datasets imported successfully!")
