import sqlite3


DB_PATH = "data/telegram_poster.db"


def get_bots():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            name,
            username,
            status
        FROM bots
        WHERE status = 'active'
        ORDER BY id ASC
    """)

    rows = cursor.fetchall()

    conn.close()

    return rows


def get_destinations(bot_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            name,
            chat_id,
            type,
            status
        FROM destinations
        WHERE bot_id = ?
        AND status = 'active'
        ORDER BY id ASC
    """, (bot_id,))

    rows = cursor.fetchall()

    conn.close()

    return rows


def get_posts():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            title,
            content
        FROM posts
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    return rows


def create_schedule(
    bot_id,
    destination_id,
    post_id,
    schedule_time
):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

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
        "active",
    ))

    conn.commit()

    schedule_id = cursor.lastrowid

    conn.close()

    print()
    print("======================================")
    print("✅ SCHEDULE BERHASIL DIBUAT")
    print("======================================")
    print(f"Schedule ID    : {schedule_id}")
    print(f"Bot ID         : {bot_id}")
    print(f"Destination ID : {destination_id}")
    print(f"Post ID        : {post_id}")
    print(f"Waktu          : {schedule_time}")
    print("Status         : active")
    print("======================================")


def show_schedules():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            s.id,
            s.bot_id,
            b.name AS bot_name,
            s.destination_id,
            d.name AS destination_name,
            s.post_id,
            p.title AS post_title,
            s.schedule_time,
            s.status
        FROM schedules s
        LEFT JOIN bots b
            ON s.bot_id = b.id
        LEFT JOIN destinations d
            ON s.destination_id = d.id
        LEFT JOIN posts p
            ON s.post_id = p.id
        ORDER BY s.id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    print()
    print("======================================")
    print("📅 DAFTAR SCHEDULE")
    print("======================================")

    if not rows:
        print("Belum ada schedule.")
        print("======================================")
        return

    for row in rows:

        print()
        print(f"#{row['id']}")
        print(f"Bot         : #{row['bot_id']} - {row['bot_name']}")
        print(
            f"Destination : #{row['destination_id']} "
            f"- {row['destination_name']}"
        )
        print(
            f"Post        : #{row['post_id']} "
            f"- {row['post_title']}"
        )
        print(f"Waktu       : {row['schedule_time']}")
        print(f"Status      : {row['status']}")
        print("--------------------------------------")

    print("======================================")


def main():

    print("======================================")
    print("📅 SCHEDULE MANAGER")
    print("======================================")
    print()
    print("1. Buat Schedule")
    print("2. Lihat Schedule")
    print()

    choice = input("Pilihan: ").strip()

    # ==================================
    # BUAT SCHEDULE
    # ==================================

    if choice == "1":

        bots = get_bots()

        if not bots:
            print("❌ Belum ada bot aktif.")
            return

        print()
        print("🤖 DAFTAR BOT")
        print("--------------------------------------")

        for bot in bots:
            print(
                f"#{bot['id']} | "
                f"{bot['name']} | "
                f"@{bot['username']}"
            )

        print()

        bot_id = input("Bot ID: ").strip()

        if not bot_id.isdigit():
            print("❌ Bot ID tidak valid.")
            return

        bot_id = int(bot_id)

        destinations = get_destinations(bot_id)

        if not destinations:
            print("❌ Bot ini belum memiliki destination.")
            return

        print()
        print("📡 DAFTAR DESTINATION")
        print("--------------------------------------")

        for destination in destinations:

            print(
                f"#{destination['id']} | "
                f"{destination['name']} | "
                f"{destination['type']} | "
                f"{destination['chat_id']}"
            )

        print()

        destination_id = input(
            "Destination ID: "
        ).strip()

        if not destination_id.isdigit():
            print("❌ Destination ID tidak valid.")
            return

        destination_id = int(destination_id)

        posts = get_posts()

        if not posts:
            print("❌ Belum ada post.")
            return

        print()
        print("📝 DAFTAR POST")
        print("--------------------------------------")

        for post in posts:

            print(
                f"#{post['id']} | "
                f"{post['title']}"
            )

        print()

        post_id = input("Post ID: ").strip()

        if not post_id.isdigit():
            print("❌ Post ID tidak valid.")
            return

        post_id = int(post_id)

        print()
        print("Format waktu:")
        print("YYYY-MM-DD HH:MM:SS")
        print()
        print("Contoh:")
        print("2026-09-14 20:30:00")
        print()

        schedule_time = input(
            "Waktu posting: "
        ).strip()

        if not schedule_time:
            print("❌ Waktu wajib diisi.")
            return

        create_schedule(
            bot_id=bot_id,
            destination_id=destination_id,
            post_id=post_id,
            schedule_time=schedule_time,
        )

    # ==================================
    # LIHAT SCHEDULE
    # ==================================

    elif choice == "2":

        show_schedules()

    else:

        print("❌ Pilihan tidak valid.")


if __name__ == "__main__":
    main()
