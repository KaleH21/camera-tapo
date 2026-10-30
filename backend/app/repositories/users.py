import sqlite3
import uuid

from app.core.database import db
from app.core.errors import error
from app.core.security import hash_password


def find_by_username(username: str) -> sqlite3.Row | None:
    with db() as conn:
        return conn.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()


def list_public() -> list[dict]:
    with db() as conn:
        rows = conn.execute('SELECT id, username, role FROM users ORDER BY username').fetchall()
    return [dict(row) for row in rows]


def create_viewer(username: str, password: str) -> dict:
    user_id = str(uuid.uuid4())
    try:
        with db() as conn:
            conn.execute('INSERT INTO users VALUES (?,?,?,?)',
                         (user_id, username, hash_password(password), 'viewer'))
    except sqlite3.IntegrityError as exc:
        raise error(409, 'USERNAME_EXISTS', 'Tên đăng nhập đã tồn tại') from exc
    return {'id': user_id, 'username': username, 'role': 'viewer'}

