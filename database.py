import sqlite3
from pathlib import Path


# Lokasi database
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATABASE_FILE = DATA_DIR / "telegram_poster.db"


def get_connection():
    DATA_DIR.mkdir(exist_ok=True)

    connection = sqlite3.connect(DATABASE_FILE)

    connection.row_factory = sqlite3.Row

    return connection


def init_database():
    connection = get_connection()
    cursor = connection.cursor()

    # =========================
    # TABLE BOTS
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT,
            token TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # =========================
    # TABLE DESTINATIONS
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS destinations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            chat_id TEXT NOT NULL,
            type TEXT DEFAULT 'group',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (bot_id)
            REFERENCES bots(id)
            ON DELETE CASCADE
        )
    """)

    # =========================
    # TABLE POSTS
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT NOT NULL,
            media_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # =========================
    # TABLE SCHEDULES
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            destination_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            schedule_time TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (bot_id)
            REFERENCES bots(id)
            ON DELETE CASCADE,

            FOREIGN KEY (destination_id)
            REFERENCES destinations(id)
            ON DELETE CASCADE,

            FOREIGN KEY (post_id)
            REFERENCES posts(id)
            ON DELETE CASCADE
        )
    """)

    # =========================
    # TABLE LOGS
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER,
            destination_id INTEGER,
            post_id INTEGER,
            status TEXT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()

    print("✅ Database berhasil diinisialisasi.")


if __name__ == "__main__":
    init_database()
