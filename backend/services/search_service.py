from backend.models.project import Project

def search_projects(keyword):

    results = Project.query.filter(
        Project.title.ilike(f"%{keyword}%")
    ).all()

    return results


def filter_projects_by_domain(domain):

    return Project.query.filter_by(
        domain=domain
    ).all()