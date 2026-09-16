import os

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes


# Membaca file .env
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 Bot berhasil aktif!\n\n"
        "Telegram Auto Poster siap digunakan."
    )


async def chatid(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat = update.effective_chat

    chat_name = chat.title or chat.first_name or "Tidak diketahui"

    await update.message.reply_text(
        f"📋 INFORMASI CHAT\n\n"
        f"Nama : {chat_name}\n"
        f"Chat ID : `{chat.id}`\n"
        f"Tipe : {chat.type}",
        parse_mode="Markdown",
    )


def main():

    if not BOT_TOKEN:
        raise ValueError(
            "BOT_TOKEN belum ditemukan. "
            "Pastikan sudah diisi di file .env"
        )

    app = Application.builder().token(BOT_TOKEN).build()

    # Command handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("chatid", chatid))

    print("======================================")
    print("🤖 TELEGRAM AUTO POSTER")
    print("======================================")
    print("Bot sedang berjalan...")
    print("Command tersedia:")
    print("  /start")
    print("  /chatid")
    print()
    print("Tekan CTRL+C untuk menghentikan bot.")

    app.run_polling()


if __name__ == "__main__":
    main()
