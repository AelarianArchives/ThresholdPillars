import os
import sys
import json
import shutil
import subprocess
from datetime import datetime
import logging

sys.stdout.reconfigure(encoding="utf-8")

# === YOUR SETTINGS ===
PROJECT_FOLDER = r"C:\Users\sasir\Desktop\Aelarian\Archives"
SIGNAL_FOLDER = r"C:\Users\sasir\Desktop\To_Parse"
USB_DRIVE = "D:\\"
USB_BACKUP_FOLDER = "threshold-backups"
B2_BUCKET = "threshold-backups"
DB_DUMPS_FOLDER = os.path.join(PROJECT_FOLDER, "db-dumps")
MANIFEST_PATH = os.path.join(PROJECT_FOLDER, "backup_manifest.json")

# === LOAD CREDENTIALS FROM .env ===
# Credentials are never hardcoded. See GITHUB_PROTOCOL.md section 5.
def _load_env():
    env_path = os.path.join(PROJECT_FOLDER, ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())

_load_env()
B2_KEY_ID = os.environ.get("B2_KEY_ID")
B2_APP_KEY = os.environ.get("B2_APP_KEY")

# === LOGGING ===
log_path = os.path.join(PROJECT_FOLDER, "backup.log")
logging.basicConfig(filename=log_path, level=logging.INFO,
    format="%(asctime)s — %(message)s", encoding="utf-8")

def log(msg):
    print(msg)
    logging.info(msg)

# === MANIFEST — tracks filepath → last modified time ===
def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}

def save_manifest(manifest):
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

# === LAYER 0: POSTGRES DUMP ===
def backup_postgres():
    try:
        os.makedirs(DB_DUMPS_FOLDER, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"aelarian_{timestamp}.sql"
        filepath = os.path.join(DB_DUMPS_FOLDER, filename)
        result = subprocess.run(
            ["docker", "exec", "aelarian-postgres", "pg_dump",
             "-U", "aelarian", "aelarian_archives"],
            capture_output=True, text=True, encoding="utf-8"
        )
        if result.returncode != 0:
            log(f"Postgres: Failed — {result.stderr.strip()}")
            return
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(result.stdout)
        log(f"Postgres: Dump complete → {filepath}")
    except Exception as e:
        log(f"Postgres: Failed — {e}")

# === LAYER 0b: SIGNAL FILE BACKUP ===
def backup_signal_files():
    if not os.path.exists(SIGNAL_FOLDER):
        log("Signal files: To_Parse not found, skipping.")
        return
    if not B2_KEY_ID or not B2_APP_KEY:
        log("Signal files: Backblaze credentials not set, skipping.")
        return
    try:
        from b2sdk.v2 import InMemoryAccountInfo, B2Api
        info = InMemoryAccountInfo()
        api = B2Api(info)
        api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
        bucket = api.get_bucket_by_name(B2_BUCKET)
        manifest = load_manifest()
        uploaded = 0
        for root, dirs, files in os.walk(SIGNAL_FOLDER):
            for filename in files:
                filepath = os.path.join(root, filename)
                try:
                    mtime = os.path.getmtime(filepath)
                except OSError:
                    continue
                if manifest.get(filepath) == mtime:
                    continue
                rel = os.path.relpath(filepath, SIGNAL_FOLDER).replace("\\", "/")
                b2_name = f"signal-files/{rel}"
                bucket.upload_local_file(local_file=filepath, file_name=b2_name)
                manifest[filepath] = mtime
                save_manifest(manifest)
                log(f"Signal files: Uploaded {rel}")
                uploaded += 1
        if uploaded == 0:
            log("Signal files: No new or changed files.")
        else:
            log(f"Signal files: {uploaded} file(s) uploaded.")
    except Exception as e:
        log(f"Signal files: Failed — {e}")

# === LAYER 1: USB BACKUP ===
def backup_to_usb():
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        dest = os.path.join(USB_DRIVE, USB_BACKUP_FOLDER, today)
        if os.path.exists(dest):
            log("USB: Backup for today already exists, skipping.")
            return
        shutil.copytree(PROJECT_FOLDER, dest)
        log(f"USB: Backup complete → {dest}")
    except Exception as e:
        log(f"USB: Failed — {e}")

# === LAYER 2: GITHUB ===
def backup_to_github():
    try:
        os.chdir(PROJECT_FOLDER)
        subprocess.run(["git", "add", "."], check=True)
        msg = f"auto-backup {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        result = subprocess.run(["git", "commit", "-m", msg], capture_output=True, text=True)
        if "nothing to commit" in result.stdout:
            log("GitHub: Nothing new to commit.")
        else:
            subprocess.run(["git", "push"], check=True)
            log("GitHub: Pushed successfully.")
    except Exception as e:
        log(f"GitHub: Failed — {e}")

# === LAYER 3: BACKBLAZE B2 ===
def backup_to_backblaze():
    if not B2_KEY_ID or not B2_APP_KEY:
        log("Backblaze: BLOCKED — B2_KEY_ID or B2_APP_KEY not set in environment.")
        log("Backblaze: Check .env file. See GITHUB_PROTOCOL.md section 5.")
        return
    try:
        from b2sdk.v2 import InMemoryAccountInfo, B2Api
        info = InMemoryAccountInfo()
        api = B2Api(info)
        api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
        bucket = api.get_bucket_by_name(B2_BUCKET)
        manifest = load_manifest()
        uploaded = 0
        exports_folder = os.path.join(PROJECT_FOLDER, "exports")
        if os.path.exists(exports_folder):
            for filename in os.listdir(exports_folder):
                if filename.endswith(".json"):
                    filepath = os.path.join(exports_folder, filename)
                    try:
                        mtime = os.path.getmtime(filepath)
                    except OSError:
                        continue
                    if manifest.get(filepath) == mtime:
                        continue
                    bucket.upload_local_file(local_file=filepath, file_name=filename)
                    manifest[filepath] = mtime
                    save_manifest(manifest)
                    log(f"Backblaze: Uploaded {filename}")
                    uploaded += 1
        if os.path.exists(DB_DUMPS_FOLDER):
            for filename in os.listdir(DB_DUMPS_FOLDER):
                if filename.endswith(".sql"):
                    filepath = os.path.join(DB_DUMPS_FOLDER, filename)
                    try:
                        mtime = os.path.getmtime(filepath)
                    except OSError:
                        continue
                    if manifest.get(filepath) == mtime:
                        continue
                    bucket.upload_local_file(local_file=filepath, file_name=filename)
                    manifest[filepath] = mtime
                    save_manifest(manifest)
                    log(f"Backblaze: Uploaded {filename}")
                    uploaded += 1
        if uploaded == 0:
            log("Backblaze: No new files to upload.")
    except Exception as e:
        log(f"Backblaze: Failed — {e}")

# === RUN ALL ===
if __name__ == "__main__":
    log("=== BACKUP STARTED ===")
    backup_postgres()
    backup_signal_files()
    backup_to_usb()
    backup_to_github()
    backup_to_backblaze()
    log("=== BACKUP COMPLETE ===")
