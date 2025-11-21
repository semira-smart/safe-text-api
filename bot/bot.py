from telegram import Update
from telegram.error import Forbidden
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes , MessageHandler, filters
import os
import httpx
import asyncio
import requests
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("BOT_TOKEN","")
BOT_NAME = '@safe_text_bot'
APIKEY = 'safe_4eba160e1949ffa1212cd9bb97d08a277bdadbb4ac8d9dfc'
ENDPOINT = 'http://127.0.0.1:8007/analyze'

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        'Hello! I am a profanity detection bot. '
        'Add me to your group chat and make me an admin to keep it clean.'
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
   
    await update.message.reply_text(
        'I can automatically detect and delete profane messages in a group chat. '
        'For me to work, you need to add me to the group and grant me admin privileges, '
        'specifically the "Delete messages" permission.'
    )

def analyze_text(text: str) -> dict | None:
    headers = {'x-api-key': APIKEY}
    payload = {'text': text}

    try:
        response = requests.post(ENDPOINT,json=payload,headers=headers)
        response.raise_for_status()
        print(response.json())
        return response.json()
    except httpx.RequestError as e:
        print(f"Error making request to profanity API: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during API call: {e}")
        return None

def handle_response(text: str)-> str:
    if 'hello' in text:
        return 'hellp'
    return 'shut up'

async def handle_message(update:Update,context:ContextTypes.DEFAULT_TYPE):
    message_type = update.message.chat.type
    text = update.message.text

    print(f'User {update.message.chat.id} in {message_type}: {text}')


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    if not message or not message.text:
        return

    message_type = message.chat.type
    text = message.text

    print(f'User {message.from_user.id} in {message_type}: "{text}"')

    # Only process messages in group chats
    if message_type in ['group', 'supergroup']:
        api_response = analyze_text(text)

        if api_response and api_response.get('success'):
            result = api_response.get('result', {})
            average_score = result.get('average', 0.0)
            profane_score = result.get('toxicity',0.0)
            obcene_score = result.get('obscene',0.0)

            print(f"Analyzed text: '{text}'. Average profanity score: {obcene_score:.2f}%")
            print(obcene_score)
            if average_score > 30 or profane_score > 70 or obcene_score > 70:
               
                try:
                    await message.delete()
                    user = message.from_user
                    warning_text = (
                        f"@{user.username} (or {user.first_name}), "
                        f"your message was deleted for containing inappropriate language."
                    )
                    await context.bot.send_message(message.chat.id, warning_text)
                    print(f"Deleted a profane message from user {user.id} in chat {message.chat.id}")
                except Forbidden:
                    print(
                        f"Error: Could not delete message in chat {message.chat.id}. "
                        f"The bot needs to be an admin with 'Delete messages' permission."
                    )
                except Exception as e:
                    print(f"An error occurred while deleting a message: {e}")


if __name__ == '__main__':
    print('Starting bot...')
    app = ApplicationBuilder().token(TOKEN).build()

    # Add command handlers
    app.add_handler(CommandHandler('start', start_command))
    app.add_handler(CommandHandler('help', help_command))

    # Add message handler
    # This handler will process all text messages that are not commands
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print('Polling...')
    # Start the bot
    app.run_polling()