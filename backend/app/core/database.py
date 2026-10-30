from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone

from app.core.config import BACKEND_DIR, db_path, settings
from app.core.security import hash_password


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def db() -> sqlite3.Connection:
    connection = sqlite3.connect(db_path, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys=ON')
    return connection


def migrate() -> None:
    with db() as conn:
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)')
        for migration in sorted((BACKEND_DIR / 'migrations').glob('*.sql')):
            version = int(migration.stem.split('_', 1)[0])
            if not conn.execute('SELECT 1 FROM schema_migrations WHERE version=?', (version,)).fetchone():
                conn.executescript(migration.read_text(encoding='utf-8'))
                conn.execute('INSERT INTO schema_migrations VALUES (?)', (version,))
        existing = conn.execute('SELECT id FROM users WHERE username=?', (settings.admin_username,)).fetchone()
        if not existing:
            conn.execute('INSERT INTO users VALUES (?,?,?,?)',
                         (str(uuid.uuid4()), settings.admin_username, hash_password(settings.admin_password), 'admin'))

