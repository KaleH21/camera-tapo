import re
import sqlite3

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.api.dependencies import current_user
from app.core.config import media_dir
from app.core.errors import error
from app.repositories import cameras
from app.services.media import media

router = APIRouter(prefix='/api/v1/cameras', tags=['media'])


@router.get('/{camera_id}/live/index.m3u8')
def manifest(camera_id: str, _: sqlite3.Row = Depends(current_user)):
    camera = cameras.get(camera_id)
    if not camera['enabled']:
        raise error(503, 'CAMERA_OFFLINE', 'Camera đang tắt')
    media.ensure(camera)
    path = media_dir / camera_id / 'index.m3u8'
    if not path.exists():
        raise error(503, 'CAMERA_OFFLINE', 'Camera chưa có tín hiệu')
    return FileResponse(path, media_type='application/vnd.apple.mpegurl',
                        headers={'Cache-Control': 'private, no-store'})


@router.get('/{camera_id}/live/{segment}')
def segment(camera_id: str, segment: str, _: sqlite3.Row = Depends(current_user)):
    cameras.get(camera_id)
    if not re.fullmatch(r'segment_\d{5,}.ts', segment):
        raise error(404, 'NOT_FOUND', 'Không tìm thấy đoạn video')
    path = media_dir / camera_id / segment
    if not path.is_file():
        raise error(404, 'NOT_FOUND', 'Không tìm thấy đoạn video')
    return FileResponse(path, media_type='video/mp2t', headers={'Cache-Control': 'private, no-store'})
