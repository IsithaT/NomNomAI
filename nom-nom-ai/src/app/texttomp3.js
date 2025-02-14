import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ 
    apiKey: process.env.OPEN_API_KEY,
});

async function generateSpeech(text) {
    if (!text || text.trim() == "") {
        console.log("No text provided");
        return;
    }

    try {
        const speechFile = path.resolve("./speech.mp3");
        
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text
        });

        const buffer = Buffer.from(await mp3.arrayBuffer())
        await fs.promises.writeFile(speechFile, buffer);

        console.log('Audio file saved: ${speechFile}');
    } catch (error) {
        console.error("Error generating speech");
    }
}

generateSpeech("hello i am testing the text to speech");
