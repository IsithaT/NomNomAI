import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001/';

const openai = new OpenAI({ 
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export class VoiceToTextService {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
    }
    
    startRecording = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                // console.log(process.env.NEXT_PUBLIC_OPENAI_API_KEY)
                
                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };
                
                this.mediaRecorder.start();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };
    
    stopRecording = () => {
        return new Promise((resolve, reject) => {
            try {
                this.mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    resolve(audioBlob);
                };
                this.mediaRecorder.stop();
            } catch (error) {
                reject(error);
            }
        });
    };
    
    transcribe = async (audioBlob) => {
    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');

        const response = await fetch(`${BASE_URL}api/voicetotext`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Network error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        throw error;
    }
};
}
