import asyncio
from telegram import Bot


class BotManager:
    def __init__(self):
        self.bots = {}

    async def add_bot(self, bot_id, token):
        """
        Menambahkan bot ke manager dan memverifikasi token.
        """

        bot = Bot(token=token)

        try:
            me = await bot.get_me()

            self.bots[bot_id] = {
                "bot": bot,
                "id": bot_id,
                "username": me.username,
                "name": me.first_name,
            }

            print(
                f"✅ Bot terhubung: "
                f"{me.first_name} (@{me.username})"
            )

            return True

        except Exception as error:
            print(f"❌ Gagal menghubungkan bot: {error}")

            return False

    def get_bot(self, bot_id):
        return self.bots.get(bot_id)

    def get_all_bots(self):
        return self.bots

    async def remove_bot(self, bot_id):
        bot_data = self.bots.pop(bot_id, None)

        if bot_data:
            await bot_data["bot"].close()
            print(f"🗑️ Bot {bot_id} dilepas.")


async def test_manager():
    print("🤖 Bot Manager aktif.")


if __name__ == "__main__":
    asyncio.run(test_manager())
