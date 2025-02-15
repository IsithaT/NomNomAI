'use client';
import { useState, useRef } from 'react';
import { VoiceToTextService } from '../services/voice-to-text';
import ReactMarkdown from "react-markdown";

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
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Voice Recording Button */}
      <button 
        onClick={handleVoiceRecording}
        className="bg-[#437dcf] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-blue-600 font-bold transition mx-auto"
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      
      {/* Audio Play/Pause Button */}
      {audio && (
        <button 
          onClick={handleToggleAudio}
          className="bg-[#cf4343] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-red-600 font-bold transition mt-4 mx-auto"
        >
          {isPlaying ? 'Pause Audio' : 'Play'}
        </button>
      )}
  
      {/* Error Message */}
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
  
      {/* Transcript Output Box */}
      {transcript && (
        <div className="mt-6 bg-white border border-[#437dcf] rounded-lg p-8 w-[80%] max-w-3xl shadow-lg overflow-y-auto max-h-96 text-[#437dcf] font-bold space-y-2 mx-auto text-center">
          <ReactMarkdown
            components={{
              p: ({ node, children }) => (
                <p className="leading-relaxed">{children}</p>
              ),
              li: ({ node, children }) => (
                <li className="ml-6 list-disc">{children}</li>
              ),
              strong: ({ node, children }) => (
                <strong className="text-[#2b5ca8]">{children}</strong>
              ),
            }}
          >
            {transcript}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
  
}