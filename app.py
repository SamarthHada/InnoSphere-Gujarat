from flask import Flask,request, render_template
from backend.config.db import db
from backend.controllers.auth_controller import auth_bp
from backend.controllers.research_controller import research_bp
from backend.controllers.analytics_controller import analytics_bp
from backend.controllers.admin_controller import admin_bp
from backend.controllers.startup_controller import startup_bp
from backend.controllers.ipr_controller import ipr_bp
from backend.controllers.notification_controller import notification_bp
from backend.controllers.upload_controller import upload_bp
from backend.controllers.report_controller import report_bp
from backend.services.upload_service import save_uploaded_file
from backend.controllers.auth_controller import (
    auth_bp,
    login_manager
)
from backend.models.project import Project
from backend.models.startup import Startup
from backend.models.ipr import IPRRecord
from backend.models.notification import Notification
from backend.models.user import User
from backend.models.publication import Publication
from backend.models.funding import Funding
from backend.models.evaluation import Evaluation
from backend.models.institution import Institution
from backend.models.activity_log import ActivityLog
from backend.models.collaboration import Collaboration
from backend.models.project import Project
from backend.config.db import db
import os
from dotenv import load_dotenv
app = Flask(__name__)
load_dotenv()
database_url = (
    os.getenv("DATABASE_URL")
    or os.getenv("MYSQL_URL")
    or "sqlite:///innosphere.db"
)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config['SECRET_KEY'] = 'innosphere_secret_key'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True

app.config["REMEMBER_COOKIE_HTTPONLY"] = True

db.init_app(app)
login_manager.init_app(app)

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

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dashboard")
@app.route("/dashboard")
def dashboard():

    total_projects = Project.query.count()

    approved_projects = Project.query.filter_by(
        status="Approved"
    ).count()

    pending_projects = Project.query.filter_by(
        status="Pending"
    ).count()

    total_startups = Startup.query.count()

    total_ipr = IPRRecord.query.count()

    total_users = User.query.count()


    projects = Project.query.order_by(
        Project.id.desc()
    ).limit(10).all()


    return render_template(

        "dashboard.html",

        total_projects=total_projects,

        approved_projects=approved_projects,

        pending_projects=pending_projects,

        total_startups=total_startups,

        total_ipr=total_ipr,

        total_users=total_users,

        projects=projects
    )
@app.route("/startups")
def startups():
    return render_template("startups.html")

@app.route("/research-form")
def research_form():
    return render_template("research_form.html")

@app.route("/admin")
def admin():
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
        return render_template(
            "research_form.html",
            form_error="Please complete the required fields before submitting."
        ), 400

    if funding_raw:
        try:
            funding = float(funding_raw)
        except ValueError:
            return render_template(
                "research_form.html",
                form_error="Funding must be a valid number."
            ), 400
    else:
        funding = None

    attachment_name = None

    if attachment and attachment.filename:
        saved_path = save_uploaded_file(attachment)

        if not saved_path:
            return render_template(
                "research_form.html",
                form_error="Only PDF research papers can be uploaded."
            ), 400

        attachment_name = os.path.basename(saved_path)


    new_project = Project(

        title=title,

        domain=domain,

        researcher=researcher,

        funding=funding,

        status="Pending",

        description=description
    )

    db.session.add(new_project)

    db.session.commit()

    return render_template(
        "research_success.html",
        title=title,
        domain=domain,
        researcher=researcher,
        funding=funding if funding is not None else "Not specified",
        attachment_name=attachment_name
    )
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=True
    )
