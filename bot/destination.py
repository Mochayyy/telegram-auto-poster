import sqlite3


DB_PATH = "data/telegram_poster.db"


def add_destination(bot_id, name, chat_id, destination_type):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO destinations (
            bot_id,
            name,
            chat_id,
            type,
            status
        )
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            bot_id,
            name,
            chat_id,
            destination_type,
            "active",
        ),
    )

    conn.commit()

    destination_id = cursor.lastrowid

    conn.close()

    print()
    print("======================================")
    print("✅ DESTINATION BERHASIL DITAMBAHKAN")
    print("======================================")
    print(f"ID       : {destination_id}")
    print(f"Bot ID   : {bot_id}")
    print(f"Nama     : {name}")
    print(f"Chat ID  : {chat_id}")
    print(f"Tipe     : {destination_type}")
    print("Status   : active")
    print("======================================")


def get_destinations(bot_id=None):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    if bot_id:

        cursor.execute(
            """
            SELECT
                id,
                bot_id,
                name,
                chat_id,
                type,
                status
            FROM destinations
            WHERE bot_id = ?
            ORDER BY id ASC
            """,
            (bot_id,),
        )

    else:

        cursor.execute(
            """
            SELECT
                id,
                bot_id,
                name,
                chat_id,
                type,
                status
            FROM destinations
            ORDER BY id ASC
            """
        )

    rows = cursor.fetchall()

    conn.close()

    return rows


def show_destinations():

    destinations = get_destinations()

    print()
    print("======================================")
    print("📋 DAFTAR DESTINATION")
    print("======================================")

    if not destinations:
        print("Belum ada grup/channel.")
        print("======================================")
        return

    for destination in destinations:

        print(
            f"#{destination['id']} | "
            f"Bot #{destination['bot_id']} | "
            f"{destination['name']} | "
            f"{destination['chat_id']} | "
            f"{destination['type']} | "
            f"{destination['status']}"
        )

    print("======================================")


def main():

    print("======================================")
    print("📡 TAMBAH DESTINATION")
    print("======================================")
    print()

    bot_id = input("Bot ID: ").strip()
    name = input("Nama Grup/Channel: ").strip()
    chat_id = input("Chat ID: ").strip()

    print()
    print("Pilih tipe destination:")
    print("1. Grup")
    print("2. Channel")

    destination_choice = input("Pilihan: ").strip()

    if destination_choice == "1":
        destination_type = "group"

    elif destination_choice == "2":
        destination_type = "channel"

    else:
        print("❌ Pilihan tidak valid.")
        return

    if not bot_id or not name or not chat_id:
        print("❌ Semua data wajib diisi.")
        return

    add_destination(
        bot_id=int(bot_id),
        name=name,
        chat_id=chat_id,
        destination_type=destination_type,
    )


if __name__ == "__main__":
    main()
