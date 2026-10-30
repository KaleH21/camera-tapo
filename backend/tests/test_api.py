import importlib
import os
import sys

from cryptography.fernet import Fernet
from fastapi.testclient import TestClient


def client(tmp_path):
    os.environ['APP_SECRET'] = 'test-secret-with-more-than-thirty-two-characters'
    os.environ['CAMERA_ENCRYPTION_KEY'] = Fernet.generate_key().decode()
    os.environ['ADMIN_PASSWORD'] = 'test-password-long-enough'
    os.environ['ADMIN_USERNAME'] = 'admin'
    os.environ['CAMERA_ALLOWED_CIDRS'] = '192.168.1.0/24'
    os.environ['DATA_DIR'] = str(tmp_path)
    sys.modules.pop('app.main', None)
    module = importlib.import_module('app.main')
    return TestClient(module.app)


def test_auth_and_media_access(tmp_path):
    with client(tmp_path) as api:
        assert api.get('/health').json() == {'status': 'ok'}
        assert api.get('/api/v1/cameras').status_code == 401
        assert api.get('/api/v1/cameras/anything/live/index.m3u8').status_code == 401
        login = api.post('/api/v1/auth/login', json={'username': 'admin', 'password': 'test-password-long-enough'})
        assert login.status_code == 200
        csrf = login.json()['csrf_token']
        camera = {'name': 'Cửa trước', 'host': '192.168.1.20', 'port': 554,
                  'stream_path': '/stream1', 'username': 'camuser', 'password': 'secret-camera'}
        assert api.post('/api/v1/cameras', json=camera).status_code == 403
        assert api.post('/api/v1/cameras', json={**camera, 'host': '127.0.0.1'}, headers={'X-CSRF-Token': csrf}).status_code == 422
        invalid = api.post('/api/v1/cameras', json={**camera, 'stream_path': '/private', 'password': 'do-not-echo'}, headers={'X-CSRF-Token': csrf})
        assert invalid.status_code == 422
        assert 'do-not-echo' not in invalid.text
        response = api.post('/api/v1/cameras', json=camera, headers={'X-CSRF-Token': csrf})
        assert response.status_code == 201
        assert 'secret-camera' not in response.text
        camera_id = response.json()['id']
        assert 'secret-camera' not in api.get('/api/v1/cameras').text
        assert api.get(f'/api/v1/cameras/{camera_id}/live/../foo.ts').status_code in (404, 422)
        assert api.delete(f'/api/v1/cameras/{camera_id}', headers={'X-CSRF-Token': csrf}).status_code == 204


def test_viewer_cannot_change_camera(tmp_path):
    with client(tmp_path) as api:
        admin_login = api.post('/api/v1/auth/login', json={'username': 'admin', 'password': 'test-password-long-enough'})
        admin_csrf = admin_login.json()['csrf_token']
        created = api.post('/api/v1/users', json={'username': 'viewer', 'password': 'viewer-password-long'}, headers={'X-CSRF-Token': admin_csrf})
        assert created.status_code == 201
        camera = api.post('/api/v1/cameras', json={'name': 'Front', 'host': '192.168.1.2', 'username': 'camera-user', 'password': 'secret-camera'}, headers={'X-CSRF-Token': admin_csrf})
        assert camera.status_code == 201
        assert api.post('/api/v1/users', json={'username': 'viewer', 'password': 'viewer-password-long'}, headers={'X-CSRF-Token': admin_csrf}).status_code == 409
        api.post('/api/v1/auth/logout', headers={'X-CSRF-Token': admin_csrf})
        login = api.post('/api/v1/auth/login', json={'username': 'viewer', 'password': 'viewer-password-long'})
        csrf = login.json()['csrf_token']
        cameras = api.get('/api/v1/cameras')
        assert cameras.status_code == 200
        assert 'camera-user' not in cameras.text and '192.168.1.2' not in cameras.text
        assert api.get('/api/v1/users').status_code == 403
        assert api.post('/api/v1/cameras', json={'name': 'Test', 'host': '192.168.1.2', 'username': 'x', 'password': 'x'}, headers={'X-CSRF-Token': csrf}).status_code == 403
