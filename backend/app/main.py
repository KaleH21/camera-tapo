from __future__ import annotations

import hashlib
import hmac
import ipaddress
import os
import re
import secrets
import sqlite3
import subprocess
import threading
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote

from cryptography.fernet import Fernet
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parents[1] / '.env')


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def token_hash(token: str) -> str:
    return hmac.new(settings.secret.encode(), token.encode(), hashlib.sha256).hexdigest()


class Settings:
    def __init__(self) -> None:
        self.secret = os.getenv('APP_SECRET', '')
        self.key = os.getenv('CAMERA_ENCRYPTION_KEY', '')
        self.admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        self.admin_password = os.getenv('ADMIN_PASSWORD', '')
        self.cidrs = os.getenv('CAMERA_ALLOWED_CIDRS', '')
        configured_data_dir = Path(os.getenv('DATA_DIR', './data'))
        self.data_dir = (configured_data_dir if configured_data_dir.is_absolute()
                         else Path(__file__).resolve().parents[1] / configured_data_dir).resolve()
        self.cookie_secure = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
        if len(self.secret) < 32 or len(self.admin_password) < 12 or self.admin_password.startswith('replace-'):
            raise RuntimeError('APP_SECRET (32+ chars) and ADMIN_PASSWORD (12+ chars) must be configured')
        try:
            self.cipher = Fernet(self.key.encode())
            self.networks = [ipaddress.ip_network(x.strip(), strict=False) for x in self.cidrs.split(',') if x.strip()]
        except (ValueError, TypeError) as exc:
            raise RuntimeError('Invalid CAMERA_ENCRYPTION_KEY or CAMERA_ALLOWED_CIDRS') from exc
        if not self.networks:
            raise RuntimeError('CAMERA_ALLOWED_CIDRS must contain at least one subnet')


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
MEDIA_DIR = settings.data_dir / 'media'
MEDIA_DIR.mkdir(exist_ok=True)
DB_PATH = settings.data_dir / 'monitor.sqlite3'


def db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys=ON')
    return connection


def migrate() -> None:
    with db() as conn:
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)')
        for migration in sorted((Path(__file__).resolve().parents[1] / 'migrations').glob('*.sql')):
            version = int(migration.stem.split('_', 1)[0])
            if not conn.execute('SELECT 1 FROM schema_migrations WHERE version=?', (version,)).fetchone():
                conn.executescript(migration.read_text(encoding='utf-8'))
                conn.execute('INSERT INTO schema_migrations VALUES (?)', (version,))
        row = conn.execute('SELECT id FROM users WHERE username=?', (settings.admin_username,)).fetchone()
        if not row:
            salt = secrets.token_bytes(16)
            digest = hashlib.scrypt(settings.admin_password.encode(), salt=salt, n=2**14, r=8, p=1)
            conn.execute('INSERT INTO users VALUES (?,?,?,?)', (str(uuid.uuid4()), settings.admin_username, salt.hex() + ':' + digest.hex(), 'admin'))


def error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={'code': code, 'message': message})


def check_host(host: str) -> str:
    try:
        address = ipaddress.IPv4Address(host)
    except ValueError as exc:
        raise error(422, 'INVALID_HOST', 'Chỉ chấp nhận địa chỉ IP trong mạng LAN được cho phép') from exc
    if address.is_loopback or address.is_link_local or not any(address in net for net in settings.networks):
        raise error(422, 'INVALID_HOST', 'Địa chỉ camera nằm ngoài dải LAN được cho phép')
    return str(address)


class LoginInput(BaseModel):
    username: str
    password: str


class ViewerInput(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r'^[a-zA-Z0-9_-]+$')
    password: str = Field(min_length=12)


class CameraInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    host: str
    port: int = Field(default=554, ge=1, le=65535)
    stream_path: str = Field(default='/stream1', pattern=r'^/stream[12]$')
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1)


class CameraPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    host: str | None = None
    port: int | None = Field(default=None, ge=1, le=65535)
    stream_path: str | None = Field(default=None, pattern=r'^/stream[12]$')
    username: str | None = Field(default=None, min_length=1, max_length=100)
    password: str | None = Field(default=None, min_length=1)
    enabled: bool | None = None


class MediaManager:
    def __init__(self) -> None:
        self.processes: dict[str, subprocess.Popen] = {}
        self.started: dict[str, float] = {}
        self.lock = threading.Lock()

    def stop(self, camera_id: str) -> None:
        with self.lock:
            process = self.processes.pop(camera_id, None)
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
            folder = MEDIA_DIR / camera_id
            if folder.exists():
                for file in folder.iterdir():
                    if file.is_file():
                        file.unlink()

    def ensure(self, camera: sqlite3.Row) -> None:
        camera_id = camera['id']
        with self.lock:
            process = self.processes.get(camera_id)
            if process and process.poll() is None:
                segments = list((MEDIA_DIR / camera_id).glob('segment_*.ts'))
                newest = max((segment.stat().st_mtime for segment in segments), default=0)
                if newest or time.monotonic() - self.started.get(camera_id, 0) < 30:
                    if not newest or time.time() - newest < 30:
                        return
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
            if time.monotonic() - self.started.get(camera_id, 0) < 5:
                return
            self.started[camera_id] = time.monotonic()
            folder = MEDIA_DIR / camera_id
            folder.mkdir(exist_ok=True)
            for file in folder.glob('*'):
                if file.is_file():
                    file.unlink()
            password = settings.cipher.decrypt(camera['password_encrypted']).decode()
            rtsp = f"rtsp://{quote(camera['username'], safe='')}:{quote(password, safe='')}@{camera['host']}:{camera['port']}{camera['stream_path']}"
            command = ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-rtsp_transport', 'tcp',
                       '-i', rtsp, '-an', '-c:v', 'copy', '-f', 'hls', '-hls_time', '2',
                       '-hls_list_size', '5', '-hls_flags', 'delete_segments+omit_endlist',
                       '-hls_segment_filename', str(folder / 'segment_%05d.ts'), str(folder / 'index.m3u8')]
            try:
                self.processes[camera_id] = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except FileNotFoundError:
                pass

    def status(self, camera: sqlite3.Row) -> tuple[str, str | None]:
        if not camera['enabled']:
            return 'disabled', None
        self.ensure(camera)
        segments = list((MEDIA_DIR / camera['id']).glob('segment_*.ts'))
        if segments:
            newest = max(segments, key=lambda x: x.stat().st_mtime)
            timestamp = newest.stat().st_mtime
            if time.time() - timestamp < 15:
                return 'online', datetime.fromtimestamp(timestamp, timezone.utc).isoformat().replace('+00:00', 'Z')
        return 'offline', None

    def shutdown(self) -> None:
        for camera_id in list(self.processes):
            self.stop(camera_id)


media = MediaManager()


@asynccontextmanager
async def lifespan(_: FastAPI):
    migrate()
    yield
    media.shutdown()


app = FastAPI(title='Tapo Home Monitor', version='0.1.0', lifespan=lifespan)


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {'code': 'REQUEST_FAILED', 'message': str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={'error': {**detail, 'request_id': request.state.request_id}})


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, _: RequestValidationError):
    return JSONResponse(status_code=422, content={'error': {'code': 'VALIDATION_ERROR',
        'message': 'Dữ liệu gửi lên không hợp lệ', 'request_id': request.state.request_id}})


@app.middleware('http')
async def request_id(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers['X-Request-ID'] = request.state.request_id
    return response


def current_user(request: Request) -> sqlite3.Row:
    token = request.cookies.get('monitor_session', '')
    if not token:
        raise error(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập')
    with db() as conn:
        row = conn.execute('''SELECT users.*, sessions.csrf FROM sessions JOIN users ON users.id=sessions.user_id
                              WHERE sessions.token_hash=? AND sessions.expires_at>?''',
                           (token_hash(token), utc_now())).fetchone()
    if not row:
        raise error(401, 'UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn')
    if request.method not in ('GET', 'HEAD', 'OPTIONS') and not hmac.compare_digest(request.headers.get('X-CSRF-Token', ''), row['csrf']):
        raise error(403, 'CSRF_FAILED', 'Yêu cầu thiếu mã bảo vệ')
    return row


def admin(user: sqlite3.Row = Depends(current_user)) -> sqlite3.Row:
    if user['role'] != 'admin':
        raise error(403, 'FORBIDDEN', 'Chỉ Admin được thao tác')
    return user


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.get('/ready')
def ready():
    with db() as conn:
        conn.execute('SELECT 1')
    return {'status': 'ready'}


attempts: dict[str, list[float]] = {}


@app.post('/api/v1/auth/login')
def login(body: LoginInput, request: Request, response: Response):
    remote = request.client.host if request.client else 'unknown'
    now = time.monotonic()
    recent = [t for t in attempts.get(remote, []) if now - t < 300]
    if len(recent) >= 8:
        raise error(429, 'RATE_LIMITED', 'Thử lại sau vài phút')
    with db() as conn:
        user = conn.execute('SELECT * FROM users WHERE username=?', (body.username,)).fetchone()
        stored = user['password_hash'] if user else secrets.token_hex(16) + ':' + secrets.token_hex(64)
        salt_hex, digest_hex = stored.split(':')
        digest = hashlib.scrypt(body.password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
        if not user or not hmac.compare_digest(digest.hex(), digest_hex):
            attempts[remote] = recent + [now]
            raise error(401, 'BAD_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng')
        attempts.pop(remote, None)
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(24)
        expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat().replace('+00:00', 'Z')
        conn.execute('INSERT INTO sessions VALUES (?,?,?,?)', (token_hash(token), user['id'], csrf, expires))
    response.set_cookie('monitor_session', token, httponly=True, secure=settings.cookie_secure, samesite='strict', max_age=604800)
    return {'username': user['username'], 'role': user['role'], 'csrf_token': csrf}


@app.get('/api/v1/auth/me')
def me(user: sqlite3.Row = Depends(current_user)):
    return {'username': user['username'], 'role': user['role'], 'csrf_token': user['csrf']}


@app.get('/api/v1/users')
def list_users(_: sqlite3.Row = Depends(admin)):
    with db() as conn:
        rows = conn.execute('SELECT id, username, role FROM users ORDER BY username').fetchall()
    return {'items': [dict(row) for row in rows]}


@app.post('/api/v1/users', status_code=201)
def create_viewer(body: ViewerInput, _: sqlite3.Row = Depends(admin)):
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(body.password.encode(), salt=salt, n=2**14, r=8, p=1)
    user_id = str(uuid.uuid4())
    try:
        with db() as conn:
            conn.execute('INSERT INTO users VALUES (?,?,?,?)',
                         (user_id, body.username, salt.hex() + ':' + digest.hex(), 'viewer'))
    except sqlite3.IntegrityError as exc:
        raise error(409, 'USERNAME_EXISTS', 'Tên đăng nhập đã tồn tại') from exc
    return {'id': user_id, 'username': body.username, 'role': 'viewer'}


@app.post('/api/v1/auth/logout')
def logout(request: Request, response: Response, _: sqlite3.Row = Depends(current_user)):
    with db() as conn:
        conn.execute('DELETE FROM sessions WHERE token_hash=?', (token_hash(request.cookies['monitor_session']),))
    response.delete_cookie('monitor_session')
    return {'ok': True}


def camera_row(camera_id: str) -> sqlite3.Row:
    with db() as conn:
        camera = conn.execute('SELECT * FROM cameras WHERE id=?', (camera_id,)).fetchone()
    if not camera:
        raise error(404, 'NOT_FOUND', 'Không tìm thấy camera')
    return camera


def public_camera(camera: sqlite3.Row, include_config: bool = False) -> dict:
    status, last_frame = media.status(camera)
    result = {'id': camera['id'], 'name': camera['name'], 'enabled': bool(camera['enabled']),
              'status': status, 'last_frame_at': last_frame,
              'live_url': f"/api/v1/cameras/{camera['id']}/live/index.m3u8"}
    if include_config:
        result.update({'host': camera['host'], 'port': camera['port'],
                       'stream_path': camera['stream_path'], 'username': camera['username']})
    return result


@app.get('/api/v1/cameras')
def list_cameras(user: sqlite3.Row = Depends(current_user)):
    with db() as conn:
        cameras = conn.execute('SELECT * FROM cameras ORDER BY created_at').fetchall()
    return {'items': [public_camera(camera, user['role'] == 'admin') for camera in cameras]}


@app.post('/api/v1/cameras', status_code=201)
def create_camera(body: CameraInput, _: sqlite3.Row = Depends(admin)):
    host = check_host(body.host)
    camera_id = str(uuid.uuid4())
    with db() as conn:
        conn.execute('INSERT INTO cameras VALUES (?,?,?,?,?,?,?,?,?)',
                     (camera_id, body.name.strip(), host, body.port, body.stream_path, body.username,
                      settings.cipher.encrypt(body.password.encode()), 1, utc_now()))
    return public_camera(camera_row(camera_id), True)


@app.patch('/api/v1/cameras/{camera_id}')
def patch_camera(camera_id: str, body: CameraPatch, _: sqlite3.Row = Depends(admin)):
    camera_row(camera_id)
    values = body.model_dump(exclude_unset=True, exclude_none=True)
    if 'host' in values:
        values['host'] = check_host(values['host'])
    if 'password' in values:
        values['password_encrypted'] = settings.cipher.encrypt(values.pop('password').encode())
    if 'enabled' in values:
        values['enabled'] = int(values['enabled'])
    if values:
        with db() as conn:
            conn.execute(f"UPDATE cameras SET {', '.join(key + '=?' for key in values)} WHERE id=?", (*values.values(), camera_id))
        media.stop(camera_id)
    return public_camera(camera_row(camera_id), True)


@app.delete('/api/v1/cameras/{camera_id}', status_code=204)
def delete_camera(camera_id: str, _: sqlite3.Row = Depends(admin)):
    camera_row(camera_id)
    media.stop(camera_id)
    with db() as conn:
        conn.execute('DELETE FROM cameras WHERE id=?', (camera_id,))


@app.post('/api/v1/cameras/{camera_id}/test')
def test_camera(camera_id: str, _: sqlite3.Row = Depends(admin)):
    camera = camera_row(camera_id)
    password = settings.cipher.decrypt(camera['password_encrypted']).decode()
    rtsp = f"rtsp://{quote(camera['username'], safe='')}:{quote(password, safe='')}@{camera['host']}:{camera['port']}{camera['stream_path']}"
    try:
        result = subprocess.run(['ffprobe', '-v', 'quiet', '-rtsp_transport', 'tcp', '-show_entries', 'stream=codec_type',
                                 '-of', 'csv=p=0', rtsp], capture_output=True, timeout=8, check=False)
        return {'ok': result.returncode == 0 and b'video' in result.stdout,
                'message': 'Kết nối thành công' if result.returncode == 0 and b'video' in result.stdout else 'Không kết nối được camera'}
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {'ok': False, 'message': 'FFprobe chưa cài đặt hoặc camera không phản hồi'}


@app.get('/api/v1/cameras/{camera_id}/live/index.m3u8')
def manifest(camera_id: str, _: sqlite3.Row = Depends(current_user)):
    camera = camera_row(camera_id)
    if not camera['enabled']:
        raise error(503, 'CAMERA_OFFLINE', 'Camera đang tắt')
    media.ensure(camera)
    path = MEDIA_DIR / camera_id / 'index.m3u8'
    if not path.exists():
        raise error(503, 'CAMERA_OFFLINE', 'Camera chưa có tín hiệu')
    return FileResponse(path, media_type='application/vnd.apple.mpegurl', headers={'Cache-Control': 'private, no-store'})


@app.get('/api/v1/cameras/{camera_id}/live/{segment}')
def segment(camera_id: str, segment: str, _: sqlite3.Row = Depends(current_user)):
    camera_row(camera_id)
    if not re.fullmatch(r'segment_\d{5,}.ts', segment):
        raise error(404, 'NOT_FOUND', 'Không tìm thấy đoạn video')
    path = MEDIA_DIR / camera_id / segment
    if not path.is_file():
        raise error(404, 'NOT_FOUND', 'Không tìm thấy đoạn video')
    return FileResponse(path, media_type='video/mp2t', headers={'Cache-Control': 'private, no-store'})
