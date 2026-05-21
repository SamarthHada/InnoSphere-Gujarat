from flask import Blueprint, request, jsonify, render_template
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required
)

from backend.services.auth_service import (
    register_user,
    authenticate_user
)

from backend.models.user import User

auth_bp = Blueprint("auth", __name__)

login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@auth_bp.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")


@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():

    data = request.json

    user = register_user(data)

    if not user:
        return jsonify({
            "error": "User already exists"
        }), 400

    return jsonify({
        "message": "Signup successful"
    })


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():

    data = request.json

    user = authenticate_user(
        data["email"],
        data["password"]
    )

    if not user:
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    login_user(user)

    return jsonify({
        "message": "Login successful",
        "role": user.role
    })


@auth_bp.route("/logout")
@login_required
def logout():

    logout_user()

    return jsonify({
        "message": "Logged out"
    })