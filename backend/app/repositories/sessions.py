import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

from app.core.database import db, utc_now
from app.core.security import token_hash


def create(user_id: str) -> tuple[str, str]:
    token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(24)
    expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat().replace('+00:00', 'Z')
    with db() as conn:
        conn.execute('INSERT INTO sessions VALUES (?,?,?,?)', (token_hash(token), user_id, csrf, expires))
    return token, csrf


def find_user(token: str) -> sqlite3.Row | None:
    with db() as conn:
        return conn.execute('''SELECT users.*, sessions.csrf FROM sessions JOIN users ON users.id=sessions.user_id
                               WHERE sessions.token_hash=? AND sessions.expires_at>?''',
                            (token_hash(token), utc_now())).fetchone()


def revoke(token: str) -> None:
    with db() as conn:
        conn.execute('DELETE FROM sessions WHERE token_hash=?', (token_hash(token),))

