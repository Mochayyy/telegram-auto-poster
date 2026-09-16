import asyncio
import sqlite3

from telegram import Bot

DB_PATH = "data/telegram_poster.db"


async def validate_bot(token):
    """Validasi token dan ambil informasi bot dari Telegram."""

    bot = Bot(token=token)

    try:
        me = await bot.get_me()

        return {
            "success": True,
            "telegram_id": me.id,
            "username": me.username,
            "name": me.first_name,
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error),
        }

    finally:
        await bot.close()


def save_bot(name, username, token):
    """Menyimpan bot ke database."""

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO bots (
            name,
            username,
            token,
            status
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            name,
            username,
            token,
            "active",
        ),
    )

    conn.commit()
    conn.close()


async def add_bot(token):
    """Validasi token kemudian simpan bot."""

    print()
    print("🔍 Memeriksa token Telegram...")

    result = await validate_bot(token)

    if not result["success"]:
        print()
        print("❌ GAGAL MENAMBAHKAN BOT")
        print("--------------------------------------")
        print("Token tidak valid atau Telegram tidak dapat")
        print("menghubungkan ke bot tersebut.")
        print()
        print(f"Detail: {result['error']}")
        return False

    save_bot(
        name=result["name"],
        username=result["username"],
        token=token,
    )

    print()
    print("======================================")
    print("✅ BOT BERHASIL DITAMBAHKAN")
    print("======================================")
    print(f"Nama       : {result['name']}")
    print(f"Username   : @{result['username']}")
    print(f"Telegram ID: {result['telegram_id']}")
    print("Status     : active")
    print("======================================")

    return True


async def main():
    print("======================================")
    print("🤖 TAMBAH BOT TELEGRAM")
    print("======================================")
    print()
    print("Masukkan token BotFather.")
    print("Token tidak akan ditampilkan di layar.")
    print()

    token = input("Token: ").strip()

    if not token:
        print("❌ Token tidak boleh kosong.")
        return

    # Jika user memasukkan BOT_TOKEN=TOKEN,
    # otomatis ambil bagian token saja.
    if token.startswith("BOT_TOKEN="):
        token = token.split("=", 1)[1].strip()

    await add_bot(token)


if __name__ == "__main__":
    asyncio.run(main())
