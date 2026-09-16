import sqlite3


DB_PATH = "data/telegram_poster.db"


def create_post(title, content, media_path=None):
    """
    Membuat post baru dan menyimpannya ke database.
    """

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO posts (
            title,
            content,
            media_path
        )
        VALUES (?, ?, ?)
        """,
        (
            title,
            content,
            media_path,
        ),
    )

    conn.commit()

    post_id = cursor.lastrowid

    conn.close()

    print()
    print("======================================")
    print("✅ POST BERHASIL DIBUAT")
    print("======================================")
    print(f"Post ID : {post_id}")
    print(f"Judul   : {title}")
    print(f"Media   : {media_path or '-'}")
    print("======================================")


def get_posts():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            title,
            content,
            media_path,
            created_at
        FROM posts
        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()

    conn.close()

    return rows


def show_posts():

    posts = get_posts()

    print()
    print("======================================")
    print("📝 DAFTAR POST")
    print("======================================")

    if not posts:
        print("Belum ada post.")
        print("======================================")
        return

    for post in posts:

        print()
        print(f"#{post['id']} - {post['title']}")
        print(f"Content : {post['content']}")
        print(f"Media   : {post['media_path'] or '-'}")
        print(f"Dibuat  : {post['created_at']}")

    print()
    print("======================================")


def main():

    print("======================================")
    print("📝 POST MANAGER")
    print("======================================")
    print()
    print("1. Buat Post")
    print("2. Lihat Post")
    print()

    choice = input("Pilihan: ").strip()

    if choice == "1":

        print()

        title = input("Judul Post: ").strip()

        print()
        print("Masukkan isi pesan.")
        print("Tekan Enter setelah selesai.")
        print()

        content = input("Content: ").strip()

        print()

        media_path = input(
            "Path gambar/video (kosongkan jika tidak ada): "
        ).strip()

        if not title or not content:
            print("❌ Judul dan content wajib diisi.")
            return

        create_post(
            title=title,
            content=content,
            media_path=media_path or None,
        )

    elif choice == "2":

        show_posts()

    else:

        print("❌ Pilihan tidak valid.")


if __name__ == "__main__":
    main()
