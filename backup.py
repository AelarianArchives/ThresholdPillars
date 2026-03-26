import os
import shutil
import subprocess
from datetime import datetime
import logging

# === YOUR SETTINGS ===
PROJECT_FOLDER = r"C:\Users\sasir\Desktop\Aelarian\Archives"
USB_DRIVE = "D:\\"
USB_BACKUP_FOLDER = "threshold-backups"
B2_KEY_ID = os.environ.get("B2_KEY_ID")
B2_APP_KEY = os.environ.get("B2_APP_KEY")
B2_BUCKET = "threshold-backups"

# === LOGGING ===
log_path = os.path.join(PROJECT_FOLDER, "backup.log")
logging.basicConfig(filename=log_path, level=logging.INFO,
    format="%(asctime)s — %(message)s")

def log(msg):
    print(msg)
    logging.info(msg)

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
    try:
        from b2sdk.v2 import InMemoryAccountInfo, B2Api
        info = InMemoryAccountInfo()
        api = B2Api(info)
        api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
        bucket = api.get_bucket_by_name(B2_BUCKET)
        exports_folder = os.path.join(PROJECT_FOLDER, "exports")
        if not os.path.exists(exports_folder):
            log("Backblaze: No exports folder found, skipping.")
            return
        for filename in os.listdir(exports_folder):
            if filename.endswith(".json"):
                filepath = os.path.join(exports_folder, filename)
                bucket.upload_local_file(local_file=filepath, file_name=filename)
                log(f"Backblaze: Uploaded {filename}")
    except Exception as e:
        log(f"Backblaze: Failed — {e}")

# === RUN ALL THREE ===
if __name__ == "__main__":
    log("=== BACKUP STARTED ===")
    backup_to_usb()
    backup_to_github()
    backup_to_backblaze()
    log("=== BACKUP COMPLETE ===")