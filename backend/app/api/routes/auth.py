import sqlite3

from fastapi import APIRouter, Depends, Request, Response

from app.api.dependencies import current_user
from app.core.config import settings
from app.repositories import sessions
from app.schemas.auth import LoginInput
from app.services.auth import authenticate

router = APIRouter(prefix='/api/v1/auth', tags=['auth'])


@router.post('/login')
def login(body: LoginInput, request: Request, response: Response):
    remote = request.client.host if request.client else 'unknown'
    user = authenticate(body.username, body.password, remote)
    token, csrf = sessions.create(user['id'])
    response.set_cookie('monitor_session', token, httponly=True, secure=settings.cookie_secure,
                        samesite='strict', max_age=604800)
    return {'username': user['username'], 'role': user['role'], 'csrf_token': csrf}


@router.get('/me')
def me(user: sqlite3.Row = Depends(current_user)):
    return {'username': user['username'], 'role': user['role'], 'csrf_token': user['csrf']}


@router.post('/logout')
def logout(request: Request, response: Response, _: sqlite3.Row = Depends(current_user)):
    sessions.revoke(request.cookies['monitor_session'])
    response.delete_cookie('monitor_session')
    return {'ok': True}

