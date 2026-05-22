from csv import DictReader
from pathlib import Path

from backend.config.db import db
from backend.models.user import User


USERS_CSV_PATH = Path(__file__).resolve().parents[2] / "data" / "users.csv"
DEFAULT_PASSWORD = "password123"


def _looks_like_password_hash(value: str | None) -> bool:
    if not value:
        return False

    return str(value).startswith(
        ("scrypt:", "pbkdf2:", "argon2:", "bcrypt:")
    )


def seed_users_from_csv(csv_path: Path | None = None) -> int:
    path = Path(csv_path) if csv_path else USERS_CSV_PATH

    if not path.exists():
        return 0

    touched = 0

    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = DictReader(handle)

        for row in reader:
            email = (row.get("email") or "").strip()
            if not email:
                continue

            user = User.query.filter_by(email=email).first()

            if user is None:
                user = User(email=email, full_name="")
                db.session.add(user)
                touched += 1

            needs_refresh = (
                user is not None
                and not _looks_like_password_hash(user.password_hash)
            )

            if user is not None and (user in db.session.new or needs_refresh):
                user.full_name = (row.get("full_name") or "").strip()
                user.role = (
                    row.get("role") or "researcher"
                ).strip() or "researcher"
                user.institution = (
                    row.get("institution") or ""
                ).strip() or None
                user.account_status = (
                    row.get("account_status") or ""
                ).strip() or None
                user.set_password(DEFAULT_PASSWORD)
                touched += 1

    if touched:
        db.session.commit()

    return touched
