from backend.models.user import User
from backend.config.db import db

def register_user(data):

    existing_user = User.query.filter_by(
        email=data["email"]
    ).first()

    if existing_user:
        return None

    user = User(
        full_name=data["full_name"],
        email=data["email"],
        role=data["role"],
        institution=data["institution"]
    )

    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return user


def authenticate_user(email, password):

    user = User.query.filter_by(
        email=email
    ).first()

    if user and user.check_password(password):
        return user

    return None