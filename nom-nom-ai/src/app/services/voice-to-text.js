import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

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
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/mpeg' });
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
      formData.append('file', audioBlob, 'audio.mp3');
      
      const transcription = await openai.audio.transcriptions.create({
          file: formData.get('file'),
          model: "whisper-1",
        });
        
        return transcription.text;
    } catch (error) {
        throw error;
    }
};
}
