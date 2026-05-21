import pandas as pd

from backend.models.project import Project
from backend.config.db import db

def import_projects_csv(csv_path):

    df = pd.read_csv(csv_path)

    for _, row in df.iterrows():

        project = Project(
            title=row.get("title"),
            domain=row.get("domain"),
            researcher=row.get("researcher", ""),
            funding=row.get("funding", row.get("funding_required", 0)),
            status=row.get("status", "Pending"),
            description=row.get("description", row.get("abstract", ""))
        )

        db.session.add(project)

    db.session.commit()

    print("Projects imported successfully")
