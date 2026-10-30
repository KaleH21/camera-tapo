"""Start API and Vite together for local development."""
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
env = os.environ.copy()
env['PYTHONPATH'] = str(ROOT / 'backend')
processes = [
    subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'], cwd=ROOT / 'backend', env=env),
    subprocess.Popen(['npm.cmd' if os.name == 'nt' else 'npm', 'run', 'dev'], cwd=ROOT / 'frontend', env=env),
]
try:
    while all(process.poll() is None for process in processes):
        time.sleep(0.3)
except KeyboardInterrupt:
    pass
finally:
    for process in processes:
        if process.poll() is None:
            process.terminate()

