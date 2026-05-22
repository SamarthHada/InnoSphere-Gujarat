from pathlib import Path
import os
import socket
from urllib.parse import urlparse

from dotenv import load_dotenv
from flask import Flask, abort, render_template, request
from flask_login import login_required

from backend.config.db import db
from backend.controllers.admin_controller import admin_bp, is_admin_user
from backend.controllers.analytics_controller import analytics_bp
from backend.controllers.auth_controller import auth_bp, login_manager
from backend.controllers.ipr_controller import ipr_bp
from backend.controllers.notification_controller import notification_bp
from backend.controllers.report_controller import report_bp
from backend.controllers.research_controller import research_bp
from backend.controllers.startup_controller import startup_bp
from backend.controllers.upload_controller import upload_bp
from backend.models.ipr import IPRRecord
from backend.models.project import Project
from backend.models.startup import Startup
from backend.models.user import User
from backend.services.upload_service import save_uploaded_file
from backend.utils.demo_data import seed_demo_data
from backend.utils.seed_users import seed_users_from_csv

load_dotenv()


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("mysql://"):
        return database_url.replace("mysql://", "mysql+pymysql://", 1)

    if database_url.startswith("mysql+mysqldb://"):
        return database_url.replace("mysql+mysqldb://", "mysql+pymysql://", 1)

    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)

    return database_url


def _mysql_host_is_local(database_url: str) -> bool:
    parsed = urlparse(database_url)

    if parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        return False

    return parsed.scheme.startswith("mysql")


def _mysql_port_is_reachable(database_url: str) -> bool:
    parsed = urlparse(database_url)
    port = parsed.port or 3306
    host = parsed.hostname or "localhost"

    try:
        with socket.create_connection((host, port), timeout=1):
            return True
    except OSError:
        return False


def _resolve_database_uri(instance_path: str) -> tuple[str, bool]:
    raw_url = (
        os.getenv("DATABASE_URL")
        or os.getenv("MYSQL_URL")
        or "sqlite:///innosphere.db"
    )
    database_url = _normalize_database_url(raw_url)

    if _mysql_host_is_local(database_url) and not _mysql_port_is_reachable(database_url):
        fallback_path = (Path(instance_path) / "innosphere.db").resolve().as_posix()
        return f"sqlite:///{fallback_path}", True

    return database_url, False


def _demo_dataset_is_empty() -> bool:
    return (
        Project.query.count() == 0
        and Startup.query.count() == 0
        and IPRRecord.query.count() == 0
        and User.query.count() == 0
    )


app = Flask(__name__)
Path(app.instance_path).mkdir(parents=True, exist_ok=True)

database_url, using_sqlite_fallback = _resolve_database_uri(app.instance_path)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SECRET_KEY"] = "innosphere_secret_key"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["REMEMBER_COOKIE_HTTPONLY"] = True

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = "auth.login_page"

app.register_blueprint(auth_bp)
app.register_blueprint(research_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(startup_bp)
app.register_blueprint(ipr_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(report_bp)

with app.app_context():
    db.create_all()

    if using_sqlite_fallback and _demo_dataset_is_empty():
        try:
            seed_demo_data()
            app.logger.warning(
                "Local MySQL was unreachable, so the app is using the seeded SQLite demo database."
            )
        except Exception:
            app.logger.exception("Failed to seed the SQLite fallback database.")
    elif not using_sqlite_fallback:
        seed_users_from_csv()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    total_projects = Project.query.count()
    approved_projects = Project.query.filter_by(status="Approved").count()
    pending_projects = Project.query.filter_by(status="Pending").count()
    total_startups = Startup.query.count()
    total_ipr = IPRRecord.query.count()
    total_users = User.query.count()

    projects = Project.query.order_by(Project.id.desc()).limit(10).all()
    db_status_label = (
        "SQLite demo fallback"
        if using_sqlite_fallback
        else "MySQL connected"
    )
    db_status_detail = (
        "Local MySQL was unreachable"
        if using_sqlite_fallback
        else "Live database active"
    )

    return render_template(
        "dashboard.html",
        total_projects=total_projects,
        approved_projects=approved_projects,
        pending_projects=pending_projects,
        total_startups=total_startups,
        total_ipr=total_ipr,
        total_users=total_users,
        projects=projects,
        db_status_label=db_status_label,
        db_status_detail=db_status_detail,
    )


@app.route("/startups")
def startups():
    return render_template("startups.html")


@app.route("/research-form")
def research_form():
    return render_template("research_form.html")


@app.route("/admin")
@login_required
def admin():
    if not is_admin_user():
        abort(403)

    return render_template("admin.html")


@app.route("/ipr")
def ipr():
    return render_template("ipr.html")


@app.route("/submit-research", methods=["POST"])
def submit_research():
    title = (request.form.get("title") or "").strip()
    domain = (request.form.get("domain") or "").strip()
    researcher = (request.form.get("researcher") or "").strip()
    funding_raw = (request.form.get("funding") or "").strip()
    description = (request.form.get("description") or "").strip()
    attachment = request.files.get("paper_file")

    if not title or not domain or not researcher:
        return (
            render_template(
                "research_form.html",
                form_error="Please complete the required fields before submitting.",
            ),
            400,
        )

    if funding_raw:
        try:
            funding = float(funding_raw)
        except ValueError:
            return (
                render_template(
                    "research_form.html",
                    form_error="Funding must be a valid number.",
                ),
                400,
            )
    else:
        funding = None

    attachment_name = None

    if attachment and attachment.filename:
        saved_path = save_uploaded_file(attachment)

        if not saved_path:
            return (
                render_template(
                    "research_form.html",
                    form_error="Only PDF research papers can be uploaded.",
                ),
                400,
            )

        attachment_name = os.path.basename(saved_path)

    new_project = Project(
        title=title,
        domain=domain,
        researcher=researcher,
        funding=funding,
        status="Pending",
        description=description,
    )

    db.session.add(new_project)
    db.session.commit()

    return render_template(
        "research_success.html",
        title=title,
        domain=domain,
        researcher=researcher,
        funding=funding if funding is not None else "Not specified",
        attachment_name=attachment_name,
    )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=True,
    )
