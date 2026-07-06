import React, { useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

export default function TtsButton({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speakText = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text: remove markdown formatting and limit length
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/\n+/g, ' ')
      .slice(0, 500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button onClick={speakText} className="tts-btn">
      {isPlaying ? (
        <>
          <FaVolumeMute /> Stop
        </>
      ) : (
        <>
          <FaVolumeUp /> Read aloud
        </>
      )}
    </button>
  );
}
