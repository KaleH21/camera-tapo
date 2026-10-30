from fastapi import APIRouter

from app.core.database import db

router = APIRouter()


@router.get('/health')
def health():
    return {'status': 'ok'}


@router.get('/ready')
def ready():
    with db() as conn:
        conn.execute('SELECT 1')
    return {'status': 'ready'}

