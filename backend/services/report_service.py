import os

import pandas as pd

from backend.models.project import Project

def export_projects_csv():

    projects = Project.query.all()

    data = []

    for project in projects:

        data.append({
            "Title": project.title,
            "Domain": project.domain,
            "Status": project.status,
            "Funding": project.funding
        })

    df = pd.DataFrame(data)

    output_dir = "static/reports"
    os.makedirs(output_dir, exist_ok=True)

    filepath = os.path.join(output_dir, "projects_report.csv")

    df.to_csv(
        filepath,
        index=False
    )

    return filepath
