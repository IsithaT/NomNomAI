'use client';
import { useState, useRef } from 'react';
import { VoiceToTextService } from '../services/voice-to-text';

export default function VoiceRecorder({ threadId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Persist the service instance across renders
  const voiceServiceRef = useRef(new VoiceToTextService());
  const voiceService = voiceServiceRef.current;

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

        if (!threadId) {
          throw new Error('No thread available');
        }
        
        // 2. Send the transcript to chat
        const chatResponse = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: threadId,
            message: userTranscript
          })
        });
        const chatData = await chatResponse.json();
        if (!chatResponse.ok) {
          throw new Error(chatData.error || 'Error getting chat response');
        }

        const aiResponseText = chatData.response;
        setTranscript(aiResponseText);

        // 3. Generate and play speech (MP3) from the AI response text
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
        
        const newAudio = new Audio(audioUrl);
        setAudio(newAudio);
        newAudio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err.message);
      setIsRecording(false);
    }
  };

  const handleToggleAudio = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
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
          onClick={handleToggleAudio}
          className="bg-[#cf4343] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-red-600 font-bold transition mt-4"
        >
          {isPlaying ? 'Pause Audio' : 'Play'}
        </button>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {transcript && (
        <div className="mt-4 bg-white border border-[#437dcf] rounded-lg p-6 max-w-2xl shadow-lg overflow-y-auto max-h-96 text-[#437dcf] font-bold space-y-2 mx-auto">
        {transcript.split("\n").map((line, index) => (
          <p key={index} className={line.startsWith("-") || line.startsWith("•") ? "ml-4 list-disc" : ""}>
            {line}
          </p>
        ))}
      </div>
      )}
    </div>
  );
}