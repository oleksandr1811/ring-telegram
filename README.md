# 🚀 Ring Telegram Motion Detect

This project allows you to receive motion detection events from a Ring doorbell and send them to Telegram.

---

## 📦 Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/oleksandr1811/ring-telegram.git
   cd ring-telegram
   ```

2. Install dependencies:

   ```bash
   npm i
   ```

3. Authenticate to obtain an API key:

   ```bash
   npm run auth
   ```

---

## 🔐 `.env` Configuration

After obtaining the API key:

1. Create a `.env` file in the root of the project.

2. Add the following variables (replace with your actual values):

   ```
   RING_REFRESH_TOKEN=your_refresh_token_here
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

---

## 🤖 Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) and create a new bot. Save the **access token**.

2. Get your **Chat ID** from [@GetMyChatID\_Bot](https://t.me/GetMyChatID_Bot).

3. Enter the token and chat ID into the `.env` file as shown above.

---

## ▶️ Run

Start the bot:

```bash
npm run start
```

---

## 🛠️ Scripts

| Command         | Description                      |
| --------------- | -------------------------------- |
| `npm i`         | Install dependencies             |
| `npm run auth`  | Authenticate and get the API key |
| `npm run start` | Start the Telegram bot           |


```
```
