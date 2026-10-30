import secrets
import sqlite3
import time

from app.core.errors import error
from app.core.security import verify_password
from app.repositories import users

_attempts: dict[str, list[float]] = {}


def authenticate(username: str, password: str, remote: str) -> sqlite3.Row:
    now = time.monotonic()
    recent = [timestamp for timestamp in _attempts.get(remote, []) if now - timestamp < 300]
    if len(recent) >= 8:
        raise error(429, 'RATE_LIMITED', 'Thử lại sau vài phút')
    user = users.find_by_username(username)
    fake_hash = secrets.token_hex(16) + ':' + secrets.token_hex(64)
    if not verify_password(password, user['password_hash'] if user else fake_hash) or not user:
        _attempts[remote] = recent + [now]
        raise error(401, 'BAD_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng')
    _attempts.pop(remote, None)
    return user

