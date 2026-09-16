import os
import subprocess
import sys
import time

PORT = os.environ.get("PORT", "5000")

worker = subprocess.Popen([
    sys.executable,
    "scheduler/worker.py"
])

web = subprocess.Popen([
    sys.executable,
    "-m",
    "gunicorn",
    "server:app",
    "--bind",
    f"0.0.0.0:{PORT}"
])

processes = [worker, web]

try:
    while True:
        for process in processes:
            if process.poll() is not None:
                raise SystemExit(process.returncode or 1)

        time.sleep(1)

except KeyboardInterrupt:
    pass

finally:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    for process in processes:
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
