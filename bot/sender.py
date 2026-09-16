import asyncio
import sqlite3

from telegram import Bot


DB_PATH = "data/telegram_poster.db"


def get_bot_and_destination(bot_id, destination_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            b.id AS bot_id,
            b.name AS bot_name,
            b.token,
            d.id AS destination_id,
            d.name AS destination_name,
            d.chat_id,
            d.type
        FROM bots b
        JOIN destinations d
            ON d.bot_id = b.id
        WHERE b.id = ?
        AND d.id = ?
        AND b.status = 'active'
        AND d.status = 'active'
        """,
        (bot_id, destination_id),
    )

    result = cursor.fetchone()

    conn.close()

    return result


async def send_message(bot_id, destination_id, message):

    data = get_bot_and_destination(
        bot_id,
        destination_id,
    )

    if not data:
        print()
        print("❌ DATA BOT / DESTINATION TIDAK DITEMUKAN")
        return False

    bot = Bot(token=data["token"])

    try:

        me = await bot.get_me()

        print()
        print("======================================")
        print("📨 MENGIRIM PESAN")
        print("======================================")
        print(f"Bot         : {me.first_name}")
        print(f"Username    : @{me.username}")
        print(f"Destination : {data['destination_name']}")
        print(f"Chat ID     : {data['chat_id']}")
        print()

        await bot.send_message(
            chat_id=data["chat_id"],
            text=message,
        )

        print("✅ PESAN BERHASIL TERKIRIM")
        print("======================================")

        return True

    except Exception as error:

        print()
        print("❌ GAGAL MENGIRIM PESAN")
        print("--------------------------------------")
        print(error)
        print("--------------------------------------")

        return False

    finally:

        try:
            await bot.close()
        except Exception:
            pass


async def main():

    print("======================================")
    print("📨 TELEGRAM MESSAGE SENDER")
    print("======================================")
    print()

    bot_id = input("Bot ID: ").strip()
    destination_id = input("Destination ID: ").strip()

    print()
    message = input("Pesan: ").strip()

    if not bot_id or not destination_id or not message:
        print("❌ Semua data wajib diisi.")
        return

    await send_message(
        bot_id=int(bot_id),
        destination_id=int(destination_id),
        message=message,
    )


if __name__ == "__main__":

    asyncio.run(main())
