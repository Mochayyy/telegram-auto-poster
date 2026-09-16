import os
import sqlite3
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(
    BASE_DIR,
    "data",
    "telegram_poster.db"
)

BACKUP_DIR = os.path.join(
    BASE_DIR,
    "backup"
)

RETENTION_DAYS = 30

os.makedirs(BACKUP_DIR, exist_ok=True)

timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

backup_path = os.path.join(
    BACKUP_DIR,
    f"telegram_poster_{timestamp}.db"
)

print("=" * 60)
print("TELEGRAM AUTO POSTER - DATABASE BACKUP")
print("=" * 60)

print(f"Database : {DB_PATH}")
print(f"Backup   : {backup_path}")

try:
    # =====================================================
    # BACKUP DATABASE
    # =====================================================

    source = sqlite3.connect(DB_PATH)
    backup = sqlite3.connect(backup_path)

    with backup:
        source.backup(backup)

    backup.close()
    source.close()

    size = os.path.getsize(backup_path)

    print()
    print("BACKUP BERHASIL!")
    print(f"File     : {backup_path}")
    print(f"Ukuran   : {size:,} bytes")

    # =====================================================
    # CLEANUP BACKUP LAMA
    # =====================================================

    cutoff = datetime.now() - timedelta(days=RETENTION_DAYS)

    deleted_count = 0

    for filename in os.listdir(BACKUP_DIR):

        if not filename.startswith("telegram_poster_"):
            continue

        if not filename.endswith(".db"):
            continue

        file_path = os.path.join(
            BACKUP_DIR,
            filename
        )

        try:
            modified_time = datetime.fromtimestamp(
                os.path.getmtime(file_path)
            )

            if modified_time < cutoff:
                os.remove(file_path)

                deleted_count += 1

                print(
                    f"🗑️ Backup lama dihapus: {filename}"
                )

        except Exception as cleanup_error:
            print(
                f"⚠️ Gagal menghapus {filename}: "
                f"{cleanup_error}"
            )

    print()
    print("CLEANUP SELESAI!")
    print(f"Backup lama dihapus : {deleted_count}")
    print(f"Retensi             : {RETENTION_DAYS} hari")

    print("=" * 60)

except Exception as e:

    print()
    print("BACKUP GAGAL!")
    print(f"Error: {e}")
    print("=" * 60)

    raise