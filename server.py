import os
import json
import sqlite3
import asyncio

from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename


# =========================================================
# PATH
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "telegram_poster.db")
DASHBOARD_DIR = os.path.join(BASE_DIR, "dashboard")
MEDIA_DIR = os.path.join(BASE_DIR, "media")

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
os.makedirs(MEDIA_DIR, exist_ok=True)


# =========================================================
# FLASK
# =========================================================

app = Flask(__name__, static_folder=None)


# =========================================================
# DATABASE
# =========================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Pastikan tabel inti dan tabel tambahan tersedia."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT DEFAULT '',
            token TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS destinations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            chat_id TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT DEFAULT '',
            media_path TEXT DEFAULT '',
            footer TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS post_buttons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            button_text TEXT NOT NULL,
            button_url TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS post_footer_buttons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            button_text TEXT NOT NULL,
            button_url TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            destination_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            schedule_time TEXT NOT NULL,
            status TEXT DEFAULT 'scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
            FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER,
            destination_id INTEGER,
            post_id INTEGER,
            status TEXT NOT NULL,
            message TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE SET NULL,
            FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
        )
    """)

    # Kompatibilitas database lama: tambahkan footer jika belum ada.
    cursor.execute("PRAGMA table_info(posts)")
    post_columns = [row[1] for row in cursor.fetchall()]

    if "footer" not in post_columns:
        cursor.execute(
            "ALTER TABLE posts ADD COLUMN footer TEXT DEFAULT ''"
        )

    conn.commit()
    conn.close()


# =========================================================
# DASHBOARD PAGES
# =========================================================

@app.route("/")
def dashboard():
    return send_from_directory(DASHBOARD_DIR, "index.html")


@app.route("/posts.html")
def posts_page():
    return send_from_directory(DASHBOARD_DIR, "posts.html")


@app.route("/media/<path:filename>")
def media_file(filename):
    return send_from_directory(MEDIA_DIR, filename)


@app.route("/<path:filename>")
def dashboard_files(filename):
    file_path = os.path.join(DASHBOARD_DIR, filename)

    if os.path.isfile(file_path):
        return send_from_directory(DASHBOARD_DIR, filename)

    return "File tidak ditemukan", 404


# =========================================================
# POSTS - GET
# =========================================================

@app.route("/api/posts", methods=["GET"])
def get_posts():
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                title,
                content,
                media_path,
                footer,
                created_at
            FROM posts
            ORDER BY id DESC
        """)

        posts = cursor.fetchall()
        result = []

        for post in posts:
            post_id = post["id"]

            cursor.execute("""
                SELECT
                    id,
                    button_text,
                    button_url,
                    sort_order
                FROM post_buttons
                WHERE post_id = ?
                ORDER BY sort_order ASC
            """, (post_id,))

            buttons = [
                {
                    "id": row["id"],
                    "text": row["button_text"],
                    "url": row["button_url"]
                }
                for row in cursor.fetchall()
            ]

            cursor.execute("""
                SELECT
                    id,
                    button_text,
                    button_url,
                    sort_order
                FROM post_footer_buttons
                WHERE post_id = ?
                ORDER BY sort_order ASC
            """, (post_id,))

            footer_buttons = [
                {
                    "id": row["id"],
                    "text": row["button_text"],
                    "url": row["button_url"]
                }
                for row in cursor.fetchall()
            ]

            result.append({
                "id": post["id"],
                "title": post["title"],
                "content": post["content"],
                "media": post["media_path"],
                "footer": post["footer"],
                "buttons": buttons,
                "footer_buttons": footer_buttons,
                "created_at": post["created_at"]
            })

        return jsonify({
            "success": True,
            "posts": result
        })

    except Exception as e:
        print("ERROR GET POSTS:", repr(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# POSTS - CREATE
# =========================================================

def parse_button_json(raw_value):
    try:
        value = json.loads(raw_value or "[]")
        return value if isinstance(value, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def save_post_buttons(cursor, post_id, buttons, table_name):
    saved = 0

    for index, button in enumerate(buttons):
        if not isinstance(button, dict):
            continue

        button_text = str(
            button.get("text", button.get("button_text", ""))
        ).strip()

        button_url = str(
            button.get("url", button.get("button_url", ""))
        ).strip()

        if not button_text or not button_url:
            continue

        cursor.execute(
            f"""
                INSERT INTO {table_name} (
                    post_id,
                    button_text,
                    button_url,
                    sort_order
                )
                VALUES (?, ?, ?, ?)
            """,
            (post_id, button_text, button_url, index)
        )

        saved += 1

    return saved


def save_uploaded_media(media_file):
    if not media_file or not media_file.filename:
        return None

    filename = secure_filename(media_file.filename)

    if not filename:
        raise ValueError("Nama file media tidak valid.")

    file_path = os.path.join(MEDIA_DIR, filename)
    media_file.save(file_path)

    return "/media/" + filename


@app.route("/api/posts", methods=["POST"])
def create_post():
    conn = None

    try:
        title = request.form.get("title", "").strip()
        content = request.form.get("content", "")
        footer = request.form.get("footer", "")

        if not title:
            return jsonify({
                "success": False,
                "message": "Judul post wajib diisi."
            }), 400

        buttons = parse_button_json(
            request.form.get("buttons", "[]")
        )

        footer_buttons = parse_button_json(
            request.form.get("footer_buttons", "[]")
        )

        media_path = save_uploaded_media(
            request.files.get("media")
        )

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO posts (
                title,
                content,
                media_path,
                footer
            )
            VALUES (?, ?, ?, ?)
        """, (
            title,
            content,
            media_path or "",
            footer
        ))

        post_id = cursor.lastrowid

        saved_buttons = save_post_buttons(
            cursor,
            post_id,
            buttons,
            "post_buttons"
        )

        saved_footer_buttons = save_post_buttons(
            cursor,
            post_id,
            footer_buttons,
            "post_footer_buttons"
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Post berhasil disimpan.",
            "post_id": post_id,
            "media": media_path,
            "buttons": saved_buttons,
            "footer_buttons": saved_footer_buttons
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR CREATE POST:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# POSTS - UPDATE
# =========================================================

@app.route("/api/posts/<int:post_id>", methods=["PUT"])
def update_post(post_id):
    conn = None

    try:
        title = request.form.get("title", "").strip()
        content = request.form.get("content", "")
        footer = request.form.get("footer", "")

        if not title:
            return jsonify({
                "success": False,
                "message": "Judul post wajib diisi."
            }), 400

        buttons = parse_button_json(
            request.form.get("buttons", "[]")
        )

        footer_buttons = parse_button_json(
            request.form.get("footer_buttons", "[]")
        )

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, media_path
            FROM posts
            WHERE id = ?
        """, (post_id,))

        post = cursor.fetchone()

        if not post:
            return jsonify({
                "success": False,
                "message": "Post tidak ditemukan."
            }), 404

        media_path = post["media_path"] or ""

        uploaded_media = request.files.get("media")

        if uploaded_media and uploaded_media.filename:
            new_media_path = save_uploaded_media(uploaded_media)

            if new_media_path:
                old_path = post["media_path"] or ""

                if old_path.startswith("/media/"):
                    old_file = os.path.join(
                        MEDIA_DIR,
                        os.path.basename(old_path)
                    )

                    if os.path.isfile(old_file):
                        try:
                            os.remove(old_file)
                        except OSError:
                            pass

                media_path = new_media_path

        cursor.execute("""
            UPDATE posts
            SET
                title = ?,
                content = ?,
                media_path = ?,
                footer = ?
            WHERE id = ?
        """, (
            title,
            content,
            media_path,
            footer,
            post_id
        ))

        cursor.execute("""
            DELETE FROM post_buttons
            WHERE post_id = ?
        """, (post_id,))

        cursor.execute("""
            DELETE FROM post_footer_buttons
            WHERE post_id = ?
        """, (post_id,))

        saved_buttons = save_post_buttons(
            cursor,
            post_id,
            buttons,
            "post_buttons"
        )

        saved_footer_buttons = save_post_buttons(
            cursor,
            post_id,
            footer_buttons,
            "post_footer_buttons"
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Post berhasil diperbarui.",
            "post_id": post_id,
            "media": media_path,
            "buttons": saved_buttons,
            "footer_buttons": saved_footer_buttons
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR UPDATE POST:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# POSTS - DELETE
# =========================================================

@app.route("/api/posts/<int:post_id>", methods=["DELETE"])
def delete_post(post_id):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, media_path
            FROM posts
            WHERE id = ?
        """, (post_id,))

        post = cursor.fetchone()

        if not post:
            return jsonify({
                "success": False,
                "message": "Post tidak ditemukan."
            }), 404

        cursor.execute("""
            DELETE FROM post_buttons
            WHERE post_id = ?
        """, (post_id,))

        cursor.execute("""
            DELETE FROM post_footer_buttons
            WHERE post_id = ?
        """, (post_id,))

        cursor.execute("""
            DELETE FROM schedules
            WHERE post_id = ?
        """, (post_id,))

        cursor.execute("""
            DELETE FROM posts
            WHERE id = ?
        """, (post_id,))

        conn.commit()

        media_path = post["media_path"] or ""

        if media_path.startswith("/media/"):
            media_file_path = os.path.join(
                MEDIA_DIR,
                os.path.basename(media_path)
            )

            if os.path.isfile(media_file_path):
                try:
                    os.remove(media_file_path)
                except OSError:
                    pass

        return jsonify({
            "success": True,
            "message": "Post berhasil dihapus."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR DELETE POST:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# BOTS - GET
# =========================================================

@app.route("/api/bots", methods=["GET"])
def get_bots():
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                name,
                username,
                status
            FROM bots
            ORDER BY id DESC
        """)

        bots = [
            {
                "id": row["id"],
                "name": row["name"],
                "username": row["username"],
                "status": row["status"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({
            "success": True,
            "bots": bots
        })

    except Exception as e:
        print("ERROR GET BOTS:", repr(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# BOTS - CREATE
# =========================================================

@app.route("/api/bots", methods=["POST"])
def create_bot():
    conn = None

    try:
        from telegram import Bot

        data = request.get_json(silent=True) or {}

        name = str(data.get("name", "")).strip()
        username = str(data.get("username", "")).strip()
        token = str(data.get("token", "")).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Nama bot wajib diisi."
            }), 400

        if not token:
            return jsonify({
                "success": False,
                "message": "Bot token wajib diisi."
            }), 400

        if token.startswith("BOT_TOKEN="):
            token = token.split("=", 1)[1].strip()

        async def validate_token():
            bot = Bot(token=token)

            try:
                me = await bot.get_me()

                return {
                    "id": me.id,
                    "username": me.username or ""
                }
            finally:
                await bot.shutdown()

        bot_info = asyncio.run(validate_token())

        if not username and bot_info["username"]:
            username = "@" + bot_info["username"]

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id
            FROM bots
            WHERE token = ?
        """, (token,))

        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Bot dengan token tersebut sudah terdaftar."
            }), 409

        cursor.execute("""
            INSERT INTO bots (
                name,
                username,
                token,
                status
            )
            VALUES (?, ?, ?, ?)
        """, (
            name,
            username,
            token,
            "active"
        ))

        bot_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Bot berhasil ditambahkan.",
            "bot": {
                "id": bot_id,
                "name": name,
                "username": username,
                "status": "active"
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR CREATE BOT:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# BOTS - DELETE
# =========================================================

@app.route("/api/bots/<int:bot_id>", methods=["DELETE"])
def delete_bot(bot_id):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name
            FROM bots
            WHERE id = ?
        """, (bot_id,))

        bot = cursor.fetchone()

        if not bot:
            return jsonify({
                "success": False,
                "message": "Bot tidak ditemukan."
            }), 404

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM destinations
            WHERE bot_id = ?
        """, (bot_id,))

        if cursor.fetchone()["total"] > 0:
            return jsonify({
                "success": False,
                "message": (
                    "Bot tidak dapat dihapus karena masih "
                    "memiliki destination."
                )
            }), 400

        cursor.execute("""
            DELETE FROM schedules
            WHERE bot_id = ?
        """, (bot_id,))

        cursor.execute("""
            DELETE FROM bots
            WHERE id = ?
        """, (bot_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Bot berhasil dihapus."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR DELETE BOT:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# DESTINATIONS - GET
# =========================================================

@app.route("/api/destinations", methods=["GET"])
def get_destinations():
    conn = None

    try:
        bot_id = request.args.get("bot_id", type=int)

        conn = get_db()
        cursor = conn.cursor()

        if bot_id:
            cursor.execute("""
                SELECT
                    id,
                    bot_id,
                    name,
                    chat_id,
                    type,
                    status
                FROM destinations
                WHERE bot_id = ?
                ORDER BY id DESC
            """, (bot_id,))
        else:
            cursor.execute("""
                SELECT
                    id,
                    bot_id,
                    name,
                    chat_id,
                    type,
                    status
                FROM destinations
                ORDER BY id DESC
            """)

        destinations = [
            {
                "id": row["id"],
                "bot_id": row["bot_id"],
                "name": row["name"],
                "chat_id": row["chat_id"],
                "type": row["type"],
                "status": row["status"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({
            "success": True,
            "destinations": destinations
        })

    except Exception as e:
        print("ERROR GET DESTINATIONS:", repr(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# DESTINATIONS - CREATE
# =========================================================

@app.route("/api/destinations", methods=["POST"])
def create_destination():
    conn = None

    try:
        data = request.get_json(silent=True) or {}

        bot_id = data.get("bot_id")
        name = str(data.get("name", "")).strip()
        chat_id = str(data.get("chat_id", "")).strip()
        destination_type = str(
            data.get("type", "")
        ).strip().lower()

        if not bot_id:
            return jsonify({
                "success": False,
                "message": "Bot wajib dipilih."
            }), 400

        try:
            bot_id = int(bot_id)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Bot ID tidak valid."
            }), 400

        if not name:
            return jsonify({
                "success": False,
                "message": "Nama destination wajib diisi."
            }), 400

        if not chat_id:
            return jsonify({
                "success": False,
                "message": "Chat ID wajib diisi."
            }), 400

        if destination_type not in ("group", "channel"):
            return jsonify({
                "success": False,
                "message": (
                    "Tipe destination harus group atau channel."
                )
            }), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name
            FROM bots
            WHERE id = ?
        """, (bot_id,))

        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Bot tidak ditemukan."
            }), 404

        cursor.execute("""
            SELECT id
            FROM destinations
            WHERE bot_id = ?
              AND chat_id = ?
        """, (bot_id, chat_id))

        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": (
                    "Destination dengan Chat ID tersebut sudah "
                    "terdaftar pada bot ini."
                )
            }), 409

        cursor.execute("""
            INSERT INTO destinations (
                bot_id,
                name,
                chat_id,
                type,
                status
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            bot_id,
            name,
            chat_id,
            destination_type,
            "active"
        ))

        destination_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Destination berhasil ditambahkan.",
            "destination": {
                "id": destination_id,
                "bot_id": bot_id,
                "name": name,
                "chat_id": chat_id,
                "type": destination_type,
                "status": "active"
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR CREATE DESTINATION:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# DESTINATIONS - DELETE
# =========================================================

@app.route("/api/destinations/<int:destination_id>", methods=["DELETE"])
def delete_destination(destination_id):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name
            FROM destinations
            WHERE id = ?
        """, (destination_id,))

        destination = cursor.fetchone()

        if not destination:
            return jsonify({
                "success": False,
                "message": "Destination tidak ditemukan."
            }), 404

        cursor.execute("""
            DELETE FROM schedules
            WHERE destination_id = ?
        """, (destination_id,))

        cursor.execute("""
            DELETE FROM destinations
            WHERE id = ?
        """, (destination_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Destination berhasil dihapus."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR DELETE DESTINATION:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# DESTINATIONS - TEST SEND
# =========================================================

@app.route(
    "/api/destinations/<int:destination_id>/test",
    methods=["POST"]
)
def test_send_destination(destination_id):
    conn = None

    try:
        from telegram import Bot

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                destinations.id,
                destinations.name,
                destinations.chat_id,
                destinations.bot_id,
                bots.name AS bot_name,
                bots.token
            FROM destinations
            LEFT JOIN bots
                ON destinations.bot_id = bots.id
            WHERE destinations.id = ?
        """, (destination_id,))

        destination = cursor.fetchone()

        if not destination:
            return jsonify({
                "success": False,
                "message": "Destination tidak ditemukan."
            }), 404

        if not destination["token"]:
            return jsonify({
                "success": False,
                "message": "Bot token tidak ditemukan."
            }), 400

        message = (
            "ðŸ¤– TEST TELEGRAM AUTO POSTER\n\n"
            "âœ… Bot berhasil terhubung.\n"
            "âœ… Destination berhasil terhubung.\n\n"
            f"ðŸ“¡ Destination : {destination['name']}\n"
            f"ðŸ†” Chat ID : {destination['chat_id']}\n\n"
            "Sistem siap digunakan."
        )

        async def send_message():
            bot = Bot(token=destination["token"])

            try:
                result = await bot.send_message(
                    chat_id=destination["chat_id"],
                    text=message
                )

                return result.message_id
            finally:
                await bot.shutdown()

        message_id = asyncio.run(send_message())

        cursor.execute("""
            INSERT INTO logs (
                bot_id,
                destination_id,
                post_id,
                status,
                message
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            destination["bot_id"],
            destination["id"],
            None,
            "success",
            "Test message berhasil dikirim."
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Test message berhasil dikirim ke Telegram.",
            "message_id": message_id
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR TEST SEND:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# SCHEDULES - GET
# =========================================================

@app.route("/api/schedules", methods=["GET"])
def get_schedules():
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                schedules.id,
                schedules.bot_id,
                schedules.destination_id,
                schedules.post_id,
                schedules.schedule_time,
                schedules.status,
                bots.name AS bot_name,
                destinations.name AS destination_name,
                posts.title AS post_title
            FROM schedules
            LEFT JOIN bots
                ON schedules.bot_id = bots.id
            LEFT JOIN destinations
                ON schedules.destination_id = destinations.id
            LEFT JOIN posts
                ON schedules.post_id = posts.id
            ORDER BY schedules.schedule_time ASC
        """)

        schedules = [
            {
                "id": row["id"],
                "bot_id": row["bot_id"],
                "destination_id": row["destination_id"],
                "post_id": row["post_id"],
                "schedule_time": row["schedule_time"],
                "status": row["status"],
                "bot_name": row["bot_name"],
                "destination_name": row["destination_name"],
                "post_title": row["post_title"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({
            "success": True,
            "schedules": schedules
        })

    except Exception as e:
        print("ERROR GET SCHEDULES:", repr(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# SCHEDULES - CREATE
# =========================================================

@app.route("/api/schedules", methods=["POST"])
def create_schedule():
    conn = None

    try:
        data = request.get_json(silent=True) or {}

        bot_id = data.get("bot_id")
        destination_id = data.get("destination_id")
        post_id = data.get("post_id")
        schedule_time = str(
            data.get("schedule_time", "")
        ).strip()

        status = str(
            data.get("status", "scheduled")
        ).strip() or "scheduled"

        if not bot_id:
            return jsonify({
                "success": False,
                "message": "Bot wajib dipilih."
            }), 400

        if not destination_id:
            return jsonify({
                "success": False,
                "message": "Destination wajib dipilih."
            }), 400

        if not post_id:
            return jsonify({
                "success": False,
                "message": "Post wajib dipilih."
            }), 400

        if not schedule_time:
            return jsonify({
                "success": False,
                "message": "Tanggal dan waktu wajib diisi."
            }), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id
            FROM bots
            WHERE id = ?
        """, (bot_id,))

        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Bot tidak ditemukan."
            }), 404

        cursor.execute("""
            SELECT
                id,
                bot_id
            FROM destinations
            WHERE id = ?
        """, (destination_id,))

        destination = cursor.fetchone()

        if not destination:
            return jsonify({
                "success": False,
                "message": "Destination tidak ditemukan."
            }), 404

        if destination["bot_id"] != int(bot_id):
            return jsonify({
                "success": False,
                "message": "Destination tidak sesuai dengan Bot."
            }), 400

        cursor.execute("""
            SELECT id
            FROM posts
            WHERE id = ?
        """, (post_id,))

        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Post tidak ditemukan."
            }), 404

        cursor.execute("""
            INSERT INTO schedules (
                bot_id,
                destination_id,
                post_id,
                schedule_time,
                status
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            bot_id,
            destination_id,
            post_id,
            schedule_time,
            status
        ))

        schedule_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Schedule berhasil dibuat.",
            "schedule_id": schedule_id
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR CREATE SCHEDULE:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# SCHEDULES - DELETE
# =========================================================

@app.route(
    "/api/schedules/<int:schedule_id>",
    methods=["DELETE"]
)
def delete_schedule(schedule_id):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id
            FROM schedules
            WHERE id = ?
        """, (schedule_id,))

        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Schedule tidak ditemukan."
            }), 404

        cursor.execute("""
            DELETE FROM schedules
            WHERE id = ?
        """, (schedule_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Schedule berhasil dihapus."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("ERROR DELETE SCHEDULE:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# LOGS
# =========================================================

@app.route("/api/logs", methods=["GET"])
def get_logs():
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                logs.id,
                logs.bot_id,
                logs.destination_id,
                logs.post_id,
                logs.status,
                logs.message,
                logs.created_at,
                bots.name AS bot_name,
                destinations.name AS destination_name,
                posts.title AS post_title
            FROM logs
            LEFT JOIN bots
                ON logs.bot_id = bots.id
            LEFT JOIN destinations
                ON logs.destination_id = destinations.id
            LEFT JOIN posts
                ON logs.post_id = posts.id
            ORDER BY logs.id DESC
            LIMIT 200
        """)

        logs = [
            {
                "id": row["id"],
                "bot_id": row["bot_id"],
                "destination_id": row["destination_id"],
                "post_id": row["post_id"],
                "status": row["status"],
                "message": row["message"],
                "created_at": row["created_at"],
                "bot_name": row["bot_name"],
                "destination_name": row["destination_name"],
                "post_title": row["post_title"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({
            "success": True,
            "logs": logs
        })

    except Exception as e:
        print("ERROR GET LOGS:", repr(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# DASHBOARD API
# =========================================================

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) AS total FROM bots")
        total_bots = cursor.fetchone()["total"]

        cursor.execute(
            "SELECT COUNT(*) AS total FROM destinations"
        )
        total_destinations = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) AS total FROM posts")
        total_posts = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM schedules
            WHERE status = 'active'
        """)
        active_schedules = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM logs
            WHERE status = 'success'
        """)
        successful_logs = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM logs
            WHERE status = 'failed'
        """)
        failed_logs = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT
                logs.id,
                logs.status,
                logs.message,
                logs.created_at,
                bots.name AS bot_name,
                destinations.name AS destination_name,
                posts.title AS post_title
            FROM logs
            LEFT JOIN bots
                ON logs.bot_id = bots.id
            LEFT JOIN destinations
                ON logs.destination_id = destinations.id
            LEFT JOIN posts
                ON logs.post_id = posts.id
            ORDER BY logs.id DESC
            LIMIT 5
        """)

        recent_logs = [
            {
                "id": row["id"],
                "status": row["status"],
                "message": row["message"],
                "created_at": row["created_at"],
                "bot_name": row["bot_name"],
                "destination_name": row["destination_name"],
                "post_title": row["post_title"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({
            "success": True,
            "stats": {
                "total_bots": total_bots,
                "total_destinations": total_destinations,
                "total_posts": total_posts,
                "active_schedules": active_schedules,
                "successful_logs": successful_logs,
                "failed_logs": failed_logs
            },
            "recent_logs": recent_logs
        })

    except Exception as e:
        print("ERROR GET DASHBOARD:", repr(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "service": "Telegram Auto Poster",
        "status": "online"
    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    init_database()

    print()
    print("======================================")
    print("ðŸ¤– TELEGRAM AUTO POSTER")
    print("======================================")
    print("Dashboard : http://127.0.0.1:5000")
    print("Posts     : http://127.0.0.1:5000/posts.html")
    print("Health    : http://127.0.0.1:5000/api/health")
    print()
    print("Server sedang berjalan...")
    print("Tekan CTRL+C untuk menghentikan.")
    print("======================================")
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
