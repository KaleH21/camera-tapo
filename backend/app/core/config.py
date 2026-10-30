from __future__ import annotations

import ipaddress
import os
from pathlib import Path

from cryptography.fernet import Fernet
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / '.env')


class Settings:
    def __init__(self) -> None:
        self.secret = os.getenv('APP_SECRET', '')
        self.key = os.getenv('CAMERA_ENCRYPTION_KEY', '')
        self.admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        self.admin_password = os.getenv('ADMIN_PASSWORD', '')
        self.cookie_secure = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'

        configured_dir = Path(os.getenv('DATA_DIR', './data'))
        self.data_dir = (configured_dir if configured_dir.is_absolute() else BACKEND_DIR / configured_dir).resolve()
        if len(self.secret) < 32 or len(self.admin_password) < 12 or self.admin_password.startswith('replace-'):
            raise RuntimeError('APP_SECRET (32+ chars) and ADMIN_PASSWORD (12+ chars) must be configured')
        try:
            self.cipher = Fernet(self.key.encode())
            cidrs = os.getenv('CAMERA_ALLOWED_CIDRS', '')
            self.networks = [ipaddress.ip_network(item.strip(), strict=False)
                             for item in cidrs.split(',') if item.strip()]
        except (ValueError, TypeError) as exc:
            raise RuntimeError('Invalid CAMERA_ENCRYPTION_KEY or CAMERA_ALLOWED_CIDRS') from exc
        if not self.networks:
            raise RuntimeError('CAMERA_ALLOWED_CIDRS must contain at least one subnet')


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
media_dir = settings.data_dir / 'media'
media_dir.mkdir(exist_ok=True)
db_path = settings.data_dir / 'monitor.sqlite3'

