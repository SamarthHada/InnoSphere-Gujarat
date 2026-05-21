from flask import Blueprint, request, jsonify
from flask_login import login_required

from backend.services.upload_service import (
    save_uploaded_file
)

upload_bp = Blueprint(
    "upload",
    __name__
)

@upload_bp.route(
    "/api/upload/research-paper",
    methods=["POST"]
)
@login_required
def upload_research_paper():

    if "file" not in request.files:

        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    filepath = save_uploaded_file(file)

    if not filepath:

        return jsonify({
            "error": "Invalid file"
        }), 400

    return jsonify({
        "message": "File uploaded successfully",
        "path": filepath
    })