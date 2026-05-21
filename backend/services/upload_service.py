import os

from werkzeug.utils import secure_filename

from backend.utils.allowed_files import (
    allowed_file
)

UPLOAD_FOLDER = "static/uploads"

def save_uploaded_file(file):

    if not file:
        return None

    if not allowed_file(file.filename):
        return None

    filename = secure_filename(file.filename)

    os.makedirs(
        UPLOAD_FOLDER,
        exist_ok=True
    )

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    file.save(filepath)

    return filepath
