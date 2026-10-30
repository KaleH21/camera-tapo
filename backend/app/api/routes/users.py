import sqlite3

from fastapi import APIRouter, Depends

from app.api.dependencies import admin
from app.repositories import users
from app.schemas.auth import ViewerInput

router = APIRouter(prefix='/api/v1/users', tags=['users'])


@router.get('')
def list_users(_: sqlite3.Row = Depends(admin)):
    return {'items': users.list_public()}


@router.post('', status_code=201)
def create_viewer(body: ViewerInput, _: sqlite3.Row = Depends(admin)):
    return users.create_viewer(body.username, body.password)

