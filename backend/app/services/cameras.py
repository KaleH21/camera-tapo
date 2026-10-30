import ipaddress
import sqlite3
import subprocess

from app.core.config import settings
from app.core.errors import error
from app.services.media import media
from app.services.rtsp import rtsp_url


def check_host(host: str) -> str:
    try:
        address = ipaddress.IPv4Address(host)
    except ValueError as exc:
        raise error(422, 'INVALID_HOST', 'Chỉ chấp nhận địa chỉ IP trong mạng LAN được cho phép') from exc
    if address.is_loopback or address.is_link_local or not any(address in net for net in settings.networks):
        raise error(422, 'INVALID_HOST', 'Địa chỉ camera nằm ngoài dải LAN được cho phép')
    return str(address)


def public_camera(camera: sqlite3.Row, include_config: bool = False) -> dict:
    status, last_frame = media.status(camera)
    result = {'id': camera['id'], 'name': camera['name'], 'enabled': bool(camera['enabled']),
              'status': status, 'last_frame_at': last_frame,
              'live_url': f"/api/v1/cameras/{camera['id']}/live/index.m3u8"}
    if include_config:
        result.update({'host': camera['host'], 'port': camera['port'],
                       'stream_path': camera['stream_path'], 'username': camera['username']})
    return result


def test_connection(camera: sqlite3.Row) -> dict:
    try:
        result = subprocess.run(['ffprobe', '-v', 'quiet', '-rtsp_transport', 'tcp', '-show_entries',
                                 'stream=codec_type', '-of', 'csv=p=0', rtsp_url(camera)],
                                capture_output=True, timeout=8, check=False)
        ok = result.returncode == 0 and b'video' in result.stdout
        return {'ok': ok, 'message': 'Kết nối thành công' if ok else 'Không kết nối được camera'}
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {'ok': False, 'message': 'FFprobe chưa cài đặt hoặc camera không phản hồi'}

