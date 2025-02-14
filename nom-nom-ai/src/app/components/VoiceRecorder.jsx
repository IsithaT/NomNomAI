'use client';
import { useState, useEffect } from 'react';
import { VoiceToTextService } from '../services/voice-to-text';

const voiceService = new VoiceToTextService();

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [audio, setAudio] = useState(null);
  // For simplicity, we use a single thread. In a production app, you may want to create a thread using /api/thread.
  const [threadId, setThreadId] = useState(null);

  // (Optional) Create a thread on mount if your chat endpoint requires one
  useEffect(() => {
    async function createThread() {
      try {
        const response = await fetch('http://localhost:3001/api/thread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
          setThreadId(data.threadId);
        }
      } catch (err) {
        console.error('Error creating thread:', err);
      }
    }
    createThread();
  }, []);

  const handleVoiceRecording = async () => {
    try {
      if (!isRecording) {
        await voiceService.startRecording();
        setIsRecording(true);
      } else {
        // Stop recording and get the audio blob
        const audioBlob = await voiceService.stopRecording();
        setIsRecording(false);
        
        // 1. Transcribe the recorded audio
        const userTranscript = await voiceService.transcribe(audioBlob);
        setTranscript(userTranscript);
        
        // 2. Add the user's message to the completion conversation and get the AI response
        const chatResponse = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: threadId, // ensure this thread exists or modify the endpoint to create one on the fly
            message: userTranscript
          })
        });
        const chatData = await chatResponse.json();
        if (!chatResponse.ok) {
          throw new Error(chatData.error || 'Error getting chat response');
        }
        
        const aiResponseText = chatData.response;
        setTranscript(aiResponseText);
        
        // 3. Generate speech (MP3) from the AI response text
        const t2mp3Response = await fetch('http://localhost:3001/api/texttomp3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiResponseText })
        });
        if (!t2mp3Response.ok) {
          const errorData = await t2mp3Response.json();
          throw new Error(errorData.error || 'Error generating voice response');
        }
        const mp3Blob = await t2mp3Response.blob();
        const audioUrl = URL.createObjectURL(mp3Blob);
        
        // 4. Play the generated audio automatically in the browser
        const audio = new Audio(audioUrl);
        setAudio(audio);
        audio.play();
      }
    } catch (err) {
      setError(err.message);
      setIsRecording(false);
    }
  };

  const handleStopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  return (
    <div>
      <button 
        onClick={handleVoiceRecording}
        className="bg-[#437dcf] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-blue-600 font-bold transition"
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      
      {audio && (
        <button 
          onClick={handleStopAudio}
          className="bg-[#cf4343] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-red-600 font-bold transition mt-4"
        >
          Stop Audio
        </button>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {transcript && (
        <div className="mt-4">
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}