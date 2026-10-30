import hashlib
import hmac
import secrets

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f'{salt.hex()}:{digest.hex()}'


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(':')
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
    return hmac.compare_digest(digest.hex(), digest_hex)


def token_hash(token: str) -> str:
    return hmac.new(settings.secret.encode(), token.encode(), hashlib.sha256).hexdigest()

