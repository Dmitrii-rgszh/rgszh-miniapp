from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
import asyncio

# 📌 Берем Telegram API из файла API.txt
with open("API.txt", "r") as f:
    BOT_TOKEN = f.read().strip()

WEB_APP_URL = "https://rgszh-miniapp.org"  # <-- Указываем твой постоянный домен

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message()
async def start_command(message: types.Message):
    user_id = message.from_user.id  # Получаем ID пользователя
    user_first_name = message.from_user.first_name  # Получаем имя пользователя

    # Передаем параметры в URL
    url = f"https://rgszh-miniapp.org/?user_id={user_id}&user_first_name={user_first_name}"
  
    # Кнопка с веб-приложением
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Открыть MiniApp", web_app=WebAppInfo(url=url))]  # Указываем URL с параметрами
        ],
        resize_keyboard=True
    )
    await message.answer("Нажмите кнопку ниже, чтобы открыть MiniApp:", reply_markup=keyboard)

async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())











