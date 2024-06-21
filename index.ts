import express, { Express, Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import bodyParser from "body-parser";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const jsonParser = bodyParser.json();

app.get("/voices", async (req: Request, res: Response) => {
  const elevenLabsURL = "https://api.elevenlabs.io/v1/voices";

  let voices = await axios.get(elevenLabsURL, {
    headers: {
      Accept: "application/json",
      "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  res.send(voices.data.voices);
});

app.post("/tts", jsonParser, async (req: Request, res: Response) => {
  const elevenLabsURL = `https://api.elevenlabs.io/v1/text-to-speech/${req.body?.voiceId}/stream`;
  const outputPath = `./audio/${randomUUID()}.mp3`;

  const headers = {
    Accept: "application/json",
    "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
  };

  const data = {
    text: req.body?.text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.0,
      use_speaker_boost: true,
    },
  };

  const writer = createWriteStream(outputPath);

  try {
    const stream = (
      await axios.post(elevenLabsURL, data, {
        headers: headers,
        responseType: "stream",
      })
    ).data;

    stream.pipe(writer);

    writer.on("finish", () => {
      console.log("Write completed.");
      res.send({ outputPath });
    });

    writer.on("error", (err) => {
      console.log("Error writing to file:", err);
      writer.close();
    });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
