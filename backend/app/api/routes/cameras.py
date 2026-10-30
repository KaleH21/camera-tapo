import sqlite3

from fastapi import APIRouter, Depends

from app.api.dependencies import admin, current_user
from app.core.config import settings
from app.repositories import cameras
from app.schemas.camera import CameraInput, CameraPatch
from app.services.cameras import check_host, public_camera, test_connection
from app.services.media import media

router = APIRouter(prefix='/api/v1/cameras', tags=['cameras'])


@router.get('')
def list_cameras(user: sqlite3.Row = Depends(current_user)):
    return {'items': [public_camera(camera, user['role'] == 'admin') for camera in cameras.all_cameras()]}


@router.post('', status_code=201)
def create_camera(body: CameraInput, _: sqlite3.Row = Depends(admin)):
    camera = cameras.create(body, check_host(body.host))
    return public_camera(camera, True)


@router.patch('/{camera_id}')
def patch_camera(camera_id: str, body: CameraPatch, _: sqlite3.Row = Depends(admin)):
    cameras.get(camera_id)
    values = body.model_dump(exclude_unset=True, exclude_none=True)
    if 'host' in values:
        values['host'] = check_host(values['host'])
    if 'password' in values:
        values['password_encrypted'] = settings.cipher.encrypt(values.pop('password').encode())
    if 'enabled' in values:
        values['enabled'] = int(values['enabled'])
    camera = cameras.update(camera_id, values)
    if values:
        media.stop(camera_id)
    return public_camera(camera, True)


@router.delete('/{camera_id}', status_code=204)
def delete_camera(camera_id: str, _: sqlite3.Row = Depends(admin)):
    cameras.get(camera_id)
    media.stop(camera_id)
    cameras.delete(camera_id)


@router.post('/{camera_id}/test')
def test_camera(camera_id: str, _: sqlite3.Row = Depends(admin)):
    return test_connection(cameras.get(camera_id))

