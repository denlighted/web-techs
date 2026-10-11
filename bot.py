import asyncio
import os
from aiohttp import web
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import KeyboardButton, ReplyKeyboardMarkup
from dotenv import load_dotenv
from google import genai

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher(storage=MemoryStorage())
client = genai.Client(api_key=GEMINI_API_KEY)


class Form(StatesGroup):
    waiting_for_prompt = State()


main_kb = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Student")],
        [KeyboardButton(text="IT-technologies")],
        [KeyboardButton(text="Contacts")],
        [KeyboardButton(text="Prompt AI")],
    ],
    resize_keyboard=True,
)

back_kb = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text="Назад")]],
    resize_keyboard=True,
)


@dp.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "Вас вітає чат-бот! Виберіть відповідну команду",
        reply_markup=main_kb,
    )


@dp.message(F.text == "Назад")
async def back_to_menu(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "Вас вітає чат-бот! Виберіть відповідну команду",
        reply_markup=main_kb,
    )


@dp.message(F.text == "Student")
async def student_info(message: types.Message):
    await message.answer("ст. Сергієнко О.І. гр. ІС-02", reply_markup=back_kb)


@dp.message(F.text == "IT-technologies")
async def tech_info(message: types.Message):
    await message.answer(
        "IT-технології: Front-end, Back-end, Cloud, WEB-технології",
        reply_markup=back_kb,
    )


@dp.message(F.text == "Contacts")
async def contacts_info(message: types.Message):
    await message.answer(
        "Контакти тел. 050-55-55-55, e-mail: student@gmail.com",
        reply_markup=back_kb,
    )


@dp.message(F.text.in_(["Prompt AI", "ChatGPT", "Gemini"]))
async def ask_ai_prompt(message: types.Message, state: FSMContext):
    await state.set_state(Form.waiting_for_prompt)
    await message.answer(
        "Введіть ваш запит для AI:",
        reply_markup=back_kb,
    )


@dp.message(Form.waiting_for_prompt)
async def process_ai_request(message: types.Message, state: FSMContext):
    if message.text == "Назад":
        await state.clear()
        await message.answer("Головне меню:", reply_markup=main_kb)
        return

    try:
        # Вызов в отдельном потоке, чтобы не блокировать event loop
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.5-flash",
            contents=message.text,
        )
        full_text = response.text or "Отримано порожню відповідь від моделі."

        chunk_size = 4000
        chunks = [
            full_text[i : i + chunk_size]
            for i in range(0, len(full_text), chunk_size)
        ]

        for index, chunk in enumerate(chunks):
            markup = main_kb if index == len(chunks) - 1 else None
            await message.answer(chunk, reply_markup=markup)

    except Exception as e:
        await message.answer(f"Помилка Gemini: {e}", reply_markup=main_kb)
    finally:
        await state.clear()


async def handle_ping(request):
    return web.Response(text="Bot is running!")


async def start_web_server():
    app = web.Application()
    app.router.add_get("/", handle_ping)
    app.router.add_get("/healthz", handle_ping)
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv("PORT", 10000))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"Web server started on port {port}")


async def main():
    await start_web_server()
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())