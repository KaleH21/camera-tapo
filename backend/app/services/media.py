from __future__ import annotations

import sqlite3
import subprocess
import threading
import time
from datetime import datetime, timezone

from app.core.config import media_dir
from app.services.rtsp import rtsp_url


class MediaManager:
    def __init__(self) -> None:
        self.processes: dict[str, subprocess.Popen] = {}
        self.started: dict[str, float] = {}
        self.lock = threading.Lock()

    def stop(self, camera_id: str) -> None:
        with self.lock:
            process = self.processes.pop(camera_id, None)
            if process and process.poll() is None:
                self._terminate(process)
            folder = media_dir / camera_id
            if folder.exists():
                for file in folder.iterdir():
                    if file.is_file():
                        file.unlink()

    @staticmethod
    def _terminate(process: subprocess.Popen) -> None:
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()

    @staticmethod
    def _latest_frame(camera_id: str) -> float:
        timestamps = []
        for segment in (media_dir / camera_id).glob('segment_*.ts'):
            try:
                timestamps.append(segment.stat().st_mtime)
            except FileNotFoundError:
                continue
        return max(timestamps, default=0)

    def ensure(self, camera: sqlite3.Row) -> None:
        camera_id = camera['id']
        with self.lock:
            process = self.processes.get(camera_id)
            if process and process.poll() is None:
                newest = self._latest_frame(camera_id)
                if not newest and time.monotonic() - self.started.get(camera_id, 0) < 30:
                    return
                if newest and time.time() - newest < 30:
                    return
                self._terminate(process)
            if time.monotonic() - self.started.get(camera_id, 0) < 5:
                return
            self.started[camera_id] = time.monotonic()
            folder = media_dir / camera_id
            folder.mkdir(exist_ok=True)
            for file in folder.glob('*'):
                if file.is_file():
                    file.unlink()
            command = ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-rtsp_transport', 'tcp',
                       '-i', rtsp_url(camera), '-an', '-c:v', 'copy', '-f', 'hls', '-hls_time', '2',
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
        timestamp = self._latest_frame(camera['id'])
        if timestamp and time.time() - timestamp < 15:
            return 'online', datetime.fromtimestamp(timestamp, timezone.utc).isoformat().replace('+00:00', 'Z')
        return 'offline', None

    def shutdown(self) -> None:
        for camera_id in list(self.processes):
            self.stop(camera_id)


media = MediaManager()
