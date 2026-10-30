import sqlite3
from urllib.parse import quote

from app.core.config import settings


def rtsp_url(camera: sqlite3.Row) -> str:
    password = settings.cipher.decrypt(camera['password_encrypted']).decode()
    return (f"rtsp://{quote(camera['username'], safe='')}:{quote(password, safe='')}@"
            f"{camera['host']}:{camera['port']}{camera['stream_path']}")

