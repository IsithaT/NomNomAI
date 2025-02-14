'use client';
import { useState } from 'react';
import { VoiceToTextService } from '../services/voice-to-text';

const voiceService = new VoiceToTextService();

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const handleVoiceRecording = async () => {
    try {
      if (!isRecording) {
        await voiceService.startRecording();
        setIsRecording(true);
      } else {
        const audioBlob = await voiceService.stopRecording();
        setIsRecording(false);
        const text = await voiceService.transcribe(audioBlob);
        setTranscript(text);
      }
    } catch (err) {
      setError(err.message);
      setIsRecording(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleVoiceRecording}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {transcript && (
        <div className="mt-4">
          <h3>Transcript:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
