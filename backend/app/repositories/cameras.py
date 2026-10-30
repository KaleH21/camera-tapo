import sqlite3
import uuid

from app.core.config import settings
from app.core.database import db, utc_now
from app.core.errors import error
from app.schemas.camera import CameraInput


def all_cameras() -> list[sqlite3.Row]:
    with db() as conn:
        return conn.execute('SELECT * FROM cameras ORDER BY created_at').fetchall()


def get(camera_id: str) -> sqlite3.Row:
    with db() as conn:
        camera = conn.execute('SELECT * FROM cameras WHERE id=?', (camera_id,)).fetchone()
    if not camera:
        raise error(404, 'NOT_FOUND', 'Không tìm thấy camera')
    return camera


def create(body: CameraInput, host: str) -> sqlite3.Row:
    camera_id = str(uuid.uuid4())
    with db() as conn:
        conn.execute('INSERT INTO cameras VALUES (?,?,?,?,?,?,?,?,?)',
                     (camera_id, body.name.strip(), host, body.port, body.stream_path, body.username,
                      settings.cipher.encrypt(body.password.encode()), 1, utc_now()))
    return get(camera_id)


def update(camera_id: str, values: dict) -> sqlite3.Row:
    if values:
        with db() as conn:
            conn.execute(f"UPDATE cameras SET {', '.join(key + '=?' for key in values)} WHERE id=?",
                         (*values.values(), camera_id))
    return get(camera_id)


def delete(camera_id: str) -> None:
    with db() as conn:
        conn.execute('DELETE FROM cameras WHERE id=?', (camera_id,))

