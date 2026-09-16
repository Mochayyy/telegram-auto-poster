import os
import sqlite3
import time
import asyncio
from datetime import datetime

from dotenv import load_dotenv
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.request import HTTPXRequest


# =========================================================
# PATH
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DB_PATH = os.path.join(
    BASE_DIR,
    "data",
    "telegram_poster.db"
)

load_dotenv(os.path.join(BASE_DIR, ".env"))


# =========================================================
# DATABASE
# =========================================================

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


# =========================================================
# GET DUE SCHEDULES
# =========================================================

def get_due_schedules():
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute(
            """
            SELECT
                schedules.id,
                schedules.bot_id,
                schedules.destination_id,
                schedules.post_id,
                schedules.schedule_time,
                schedules.status,

                bots.name AS bot_name,
                bots.username AS bot_username,
                bots.token AS bot_token,

                destinations.name AS destination_name,
                destinations.chat_id,
                destinations.type AS destination_type,

                posts.title AS post_title,
                posts.content AS post_content,
                posts.media_path,
                posts.footer

            FROM schedules

            LEFT JOIN bots
                ON schedules.bot_id = bots.id

            LEFT JOIN destinations
                ON schedules.destination_id = destinations.id

            LEFT JOIN posts
                ON schedules.post_id = posts.id

            WHERE
                schedules.status IN ('scheduled', 'active')
                AND schedules.schedule_time <= ?

            ORDER BY
                schedules.schedule_time ASC
            """,
            (now,)
        )

        return cursor.fetchall()

    except Exception as e:
        print("❌ ERROR GET DUE SCHEDULES:", str(e))
        return []

    finally:
        if conn:
            conn.close()


# =========================================================
# CLAIM SCHEDULE
# Prevent duplicate processing if worker sees the same row
# =========================================================

def claim_schedule(schedule_id):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE schedules
            SET status = 'processing'
            WHERE id = ?
              AND status IN ('scheduled', 'active')
            """,
            (schedule_id,)
        )

        conn.commit()

        return cursor.rowcount == 1

    except Exception as e:
        print("❌ ERROR CLAIM SCHEDULE:", str(e))
        return False

    finally:
        if conn:
            conn.close()


# =========================================================
# GET MAIN BUTTONS
# =========================================================

def get_post_buttons(post_id):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                button_text,
                button_url
            FROM post_buttons
            WHERE post_id = ?
            ORDER BY sort_order ASC, id ASC
            """,
            (post_id,)
        )

        return cursor.fetchall()

    except Exception as e:
        print("❌ ERROR GET POST BUTTONS:", str(e))
        return []

    finally:
        if conn:
            conn.close()


# =========================================================
# GET FOOTER BUTTONS
# =========================================================

def get_footer_buttons(post_id):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                button_text,
                button_url
            FROM post_footer_buttons
            WHERE post_id = ?
            ORDER BY sort_order ASC, id ASC
            """,
            (post_id,)
        )

        return cursor.fetchall()

    except Exception as e:
        print("❌ ERROR GET FOOTER BUTTONS:", str(e))
        return []

    finally:
        if conn:
            conn.close()


# =========================================================
# BUILD TELEGRAM KEYBOARD
# =========================================================

def build_keyboard(post_id):
    rows = []

    for button in get_post_buttons(post_id):
        text = str(button["button_text"] or "").strip()
        url = str(button["button_url"] or "").strip()

        if text and url:
            rows.append([
                InlineKeyboardButton(
                    text=text,
                    url=url
                )
            ])

    for button in get_footer_buttons(post_id):
        text = str(button["button_text"] or "").strip()
        url = str(button["button_url"] or "").strip()

        if text and url:
            rows.append([
                InlineKeyboardButton(
                    text=text,
                    url=url
                )
            ])

    if not rows:
        return None

    return InlineKeyboardMarkup(rows)


# =========================================================
# BUILD MESSAGE
# =========================================================

def build_message(schedule):
    content = str(schedule["post_content"] or "").strip()
    footer = str(schedule["footer"] or "").strip()

    parts = []

    if content:
        parts.append(content)

    if footer:
        parts.append(footer)

    return "\n\n".join(parts)


# =========================================================
# SAVE LOG
# =========================================================

def save_log(
    bot_id,
    destination_id,
    post_id,
    status,
    message
):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO logs (
                bot_id,
                destination_id,
                post_id,
                status,
                message
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                bot_id,
                destination_id,
                post_id,
                status,
                message
            )
        )

        conn.commit()

    except Exception as e:
        print("❌ ERROR SAVE LOG:", str(e))

    finally:
        if conn:
            conn.close()


# =========================================================
# UPDATE SCHEDULE STATUS
# =========================================================

def update_schedule_status(schedule_id, status):
    conn = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE schedules
            SET status = ?
            WHERE id = ?
            """,
            (status, schedule_id)
        )

        conn.commit()

    except Exception as e:
        print("❌ ERROR UPDATE SCHEDULE:", str(e))

    finally:
        if conn:
            conn.close()


# =========================================================
# SEND POST
# =========================================================

async def send_post(schedule):
    token = str(schedule["bot_token"] or "").strip()
    chat_id = str(schedule["chat_id"] or "").strip()

    post_id = schedule["post_id"]

    if not token:
        raise Exception("Token Bot tidak ditemukan.")

    if not chat_id:
        raise Exception("Chat ID Destination tidak ditemukan.")

    message = build_message(schedule)
    keyboard = build_keyboard(post_id)

    request = HTTPXRequest(
        connect_timeout=30.0,
        read_timeout=120.0,
        write_timeout=120.0,
        pool_timeout=30.0
    )

    bot = Bot(
        token=token,
        request=request
    )

    try:
        media_path = schedule["media_path"]

        if media_path:
            media_file = str(media_path).strip()

            # -------------------------------------------------
            # RESOLVE MEDIA PATH
            # -------------------------------------------------

            # Normalisasi slash
            media_file = media_file.replace("\\", os.sep).replace("/", os.sep)

            # 1. Jika path langsung ditemukan, gunakan path tersebut
            if os.path.exists(media_file):
                media_file = os.path.abspath(media_file)

            else:
                # 2. Ambil nama file saja
                filename = os.path.basename(media_file)

                # 3. Cari di folder media project
                project_media = os.path.join(
                    BASE_DIR,
                    "media",
                    filename
                )

                # 4. Cari juga relatif terhadap BASE_DIR
                relative_media = os.path.join(
                    BASE_DIR,
                    media_file
                )

                if os.path.exists(project_media):
                    media_file = os.path.abspath(project_media)

                elif os.path.exists(relative_media):
                    media_file = os.path.abspath(relative_media)

                else:
                    raise Exception(
                        "Media tidak ditemukan.\n"
                        f"Path database : {media_path}\n"
                        f"Dicari di     : {project_media}"
                    )

            media_file = os.path.normpath(media_file)

            print(f"🖼️ Media       : {media_file}")

            extension = os.path.splitext(media_file)[1].lower()

            with open(media_file, "rb") as file:
                if extension in [".jpg", ".jpeg", ".png", ".webp"]:
                    await bot.send_photo(
                        chat_id=chat_id,
                        photo=file,
                        caption=message[:1024] if message else None,
                        reply_markup=keyboard
                    )

                elif extension in [".mp4", ".mov", ".avi", ".mkv"]:
                    await bot.send_video(
                        chat_id=chat_id,
                        video=file,
                        caption=message[:1024] if message else None,
                        reply_markup=keyboard
                    )

                else:
                    await bot.send_document(
                        chat_id=chat_id,
                        document=file,
                        caption=message[:1024] if message else None,
                        reply_markup=keyboard
                    )

            # Telegram media captions have a length limit.
            # If the original message is longer, send the remainder
            # as a normal text message so it is not silently lost.
            if len(message) > 1024:
                await bot.send_message(
                    chat_id=chat_id,
                    text=message[1024:],
                    reply_markup=None
                )

        # -------------------------------------------------
        # TEXT ONLY
        # -------------------------------------------------

        else:
            if not message:
                message = schedule["post_title"] or "Telegram Auto Poster"

            await bot.send_message(
                chat_id=chat_id,
                text=message,
                reply_markup=keyboard
            )

    finally:
        await bot.shutdown()


# =========================================================
# PROCESS SCHEDULE
# =========================================================

def process_schedule(schedule):
    schedule_id = schedule["id"]

    print("")
    print("=" * 60)
    print("🚀 PROCESSING SCHEDULE")
    print(f"Schedule ID : {schedule_id}")
    print(f"Bot         : {schedule['bot_name']}")
    print(f"Destination : {schedule['destination_name']}")
    print(f"Post        : {schedule['post_title']}")
    print(f"Schedule    : {schedule['schedule_time']}")
    print("=" * 60)

    try:
        asyncio.run(send_post(schedule))

        update_schedule_status(
            schedule_id,
            "completed"
        )

        save_log(
            schedule["bot_id"],
            schedule["destination_id"],
            schedule["post_id"],
            "success",
            "Post berhasil dikirim ke Telegram."
        )

        print("✅ POST BERHASIL DIKIRIM!")
        print(
            f"📡 Destination: {schedule['destination_name']}"
        )

    except Exception as e:
        error_message = str(e)

        print("❌ GAGAL MENGIRIM POST:")
        print(error_message)

        update_schedule_status(
            schedule_id,
            "failed"
        )

        save_log(
            schedule["bot_id"],
            schedule["destination_id"],
            schedule["post_id"],
            "failed",
            error_message
        )


# =========================================================
# MAIN WORKER
# =========================================================

def run_worker():
    print("")
    print("=" * 60)
    print("🚀 TELEGRAM AUTO POSTER")
    print("🚀 SCHEDULER ENGINE")
    print("=" * 60)
    print(f"📁 Database : {DB_PATH}")
    print("⏱️ Checking schedule setiap 1 detik...")
    print("🟢 Scheduler Engine aktif.")
    print("=" * 60)

    while True:
        try:
            schedules = get_due_schedules()

            for schedule in schedules:
                schedule_id = schedule["id"]

                # Atomically change scheduled/active -> processing.
                # If another worker/process already claimed it,
                # rowcount will be 0 and this worker skips it.
                if not claim_schedule(schedule_id):
                    continue

                process_schedule(schedule)

            time.sleep(1)

        except KeyboardInterrupt:
            print("")
            print("🛑 Scheduler Engine dihentikan.")
            break

        except Exception as e:
            print("❌ WORKER ERROR:", str(e))
            time.sleep(3)


# =========================================================
# START
# =========================================================

if __name__ == "__main__":
    run_worker()
