import hmac
import sqlite3

from fastapi import Depends, Request

from app.core.errors import error
from app.repositories import sessions


def current_user(request: Request) -> sqlite3.Row:
    token = request.cookies.get('monitor_session', '')
    if not token:
        raise error(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập')
    user = sessions.find_user(token)
    if not user:
        raise error(401, 'UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn')
    if request.method not in ('GET', 'HEAD', 'OPTIONS'):
        if not hmac.compare_digest(request.headers.get('X-CSRF-Token', ''), user['csrf']):
            raise error(403, 'CSRF_FAILED', 'Yêu cầu thiếu mã bảo vệ')
    return user


def admin(user: sqlite3.Row = Depends(current_user)) -> sqlite3.Row:
    if user['role'] != 'admin':
        raise error(403, 'FORBIDDEN', 'Chỉ Admin được thao tác')
    return user

