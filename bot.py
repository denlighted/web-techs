import asyncio
import os
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
    # Вкажіть ваше прізвище та групу
    await message.answer("ст. Гарковенко Д.В. гр. ІП-33 Варіант 20", reply_markup=back_kb)


@dp.message(F.text == "IT-technologies")
async def tech_info(message: types.Message):
    await message.answer(
        "IT-технології: Front-end, Back-end, Cloud, WEB-технології",
        reply_markup=back_kb,
    )


@dp.message(F.text == "Contacts")
async def contacts_info(message: types.Message):
    await message.answer(
        "Контакти тел. 09990960205, e-mail: dgarkovenko10@gmail.com",
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

    # Запит до Gemini
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=message.text,
        )
        await message.answer(response.text, reply_markup=main_kb)
    except Exception as e:
        await message.answer(f"Помилка Gemini: {e}", reply_markup=main_kb)
    finally:
        await state.clear()


async def main():
    print("Бот запущений...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())