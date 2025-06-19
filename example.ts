import { PushNotificationAction, RingApi } from "ring-client-api";
import { readFile, writeFile, createReadStream } from "fs";
import { promisify } from "util";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN!;
const telegramChatId = process.env.TELEGRAM_CHAT_ID!;
const outputDirectory = path.join(__dirname, "output");

function generateSymbols(): string {
  const symbols = [];
  for (let i = 0; i < 10; i++) {
    symbols.push(String.fromCharCode(Math.floor(Math.random() * 26) + 97));
  }
  return symbols.join("");
}

async function cleanOutputDirectory() {
  const fs = await import("fs/promises");
  try {
    await fs.rm(outputDirectory, { recursive: true, force: true });
  } catch (e) {
    console.error("Failed to clean output directory:", e);
  }
  await fs.mkdir(outputDirectory, { recursive: true });
}

async function getMiniVideo(): Promise<string> {
  const ringApi = new RingApi({
    refreshToken: process.env.RING_REFRESH_TOKEN!,
    debug: true,
  });

  const cameras = await ringApi.getCameras();
  const camera = cameras[0];

  if (!camera) {
    console.log("No cameras found");
    return "";
  }

  await cleanOutputDirectory();

  const filename = generateSymbols() + ".mp4";
  const filepath = path.join(outputDirectory, filename);

  console.log(`Starting Video from ${camera.name} ...`);
  await camera.recordToFile(filepath, 10);
  console.log("Done recording video");

  return filename;
}

async function sendMessageToTelegram(message: string, video?: string) {
  if (video) {
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendVideo`;
    const form = new FormData();
    form.append("chat_id", telegramChatId);
    form.append("caption", message);
    form.append("video", createReadStream(path.join(outputDirectory, video)));

    const response = await fetch(telegramApiUrl, {
      method: "POST",
      body: form as any,
      headers: (form as any).getHeaders(),
    });

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      console.log(await response.json());
    } else {
      console.log(await response.text());
    }
  } else {
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: telegramChatId, text: message }),
    });

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      console.log(await response.json());
    } else {
      console.log(await response.text());
    }
  }
}

async function example() {
  const { env } = process;
  const ringApi = new RingApi({
    refreshToken: env.RING_REFRESH_TOKEN!,
    debug: true,
  });

  const locations = await ringApi.getLocations();
  const allCameras = await ringApi.getCameras();

  console.log(`Found ${locations.length} location(s) with ${allCameras.length} camera(s).`);

  ringApi.onRefreshTokenUpdated.subscribe(async ({ newRefreshToken, oldRefreshToken }) => {
    if (!oldRefreshToken) return;

    console.log("Refresh Token Updated: ", newRefreshToken);
    const currentConfig = await promisify(readFile)(".env");
    const updatedConfig = currentConfig.toString().replace(oldRefreshToken, newRefreshToken);
    await promisify(writeFile)(".env", updatedConfig);
  });

  for (const location of locations) {
    let haveConnected = false;
    location.onConnected.subscribe((connected) => {
      if (!haveConnected && !connected) return;
      if (connected) haveConnected = true;

      const status = connected ? "Connected to" : "Disconnected from";
      console.log(`**** ${status} location ${location.name} - ${location.id}`);
    });
  }

  for (const location of locations) {
    const cameras = location.cameras;
    const devices = await location.getDevices();

    console.log(`\nLocation ${location.name} (${location.id}) has the following ${cameras.length} camera(s):`);
    cameras.forEach((camera) => {
      console.log(`- ${camera.id}: ${camera.name} (${camera.deviceType})`);
    });

    console.log(`\nLocation ${location.name} (${location.id}) has the following ${devices.length} device(s):`);
    devices.forEach((device) => {
      console.log(`- ${device.zid}: ${device.name} (${device.deviceType})`);
    });
  }

  if (allCameras.length) {
    allCameras.forEach((camera) => {
      camera.onNewNotification.subscribe(async (notification) => {
        const action = notification.android_config.category;
        const event =
          action === PushNotificationAction.Motion
            ? "Motion detected"
            : action === PushNotificationAction.Ding
            ? "Doorbell pressed"
            : `Video started (${action})`;

        console.log(`${event} on ${camera.name}. Ding ID: ${notification.data.event.ding.id}`);

        if (event === "Motion detected") {
          await sendMessageToTelegram(
            `Motion detected on ${camera.name}`,
            await getMiniVideo()
          );
        }
      });
    });

    console.log("Listening for motion and doorbell presses on your cameras.");
  }
}

example().catch((e) => console.error("Unhandled error:", e));
