from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
import asyncio
from datetime import datetime

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

    # Генерируем версию на основе текущего времени для обхода кэша
    version = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Передаем параметры в URL с версией для принудительного обновления
    url = f"https://rgszh-miniapp.org/?v={version}&user_id={user_id}&user_first_name={user_first_name}"
  
    # Кнопка с веб-приложением
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Открыть MiniApp", web_app=WebAppInfo(url=url))]  # Указываем URL с параметрами
        ],
        resize_keyboard=True
    )
    
    # Добавляем эмодзи и информацию о версии для пользователя
    await message.answer(
        f"🚀 Нажмите кнопку ниже, чтобы открыть MiniApp:\n"
        f"📱 Версия: {version[:8]}",
        reply_markup=keyboard
    )

async def main():
    print(f"🤖 Бот запущен! Версия от {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())











