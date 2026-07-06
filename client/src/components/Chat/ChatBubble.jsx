import React from 'react';
import TtsButton from '../common/TtsButton';

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`bubble-wrap ${isUser ? 'user' : ''}`}>
      <div className={`avatar ${isUser ? 'avatar-user' : 'avatar-bot'}`}>
        {isUser ? '🧑' : '🤖'}
      </div>
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column' }}>
        <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`}>
          {message.content}
        </div>
        <div className="bubble-time" style={{ alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
          {message.time}
        </div>
        {!isUser && (
          <div style={{ marginTop: '0.3rem', alignSelf: 'flex-start' }}>
            <TtsButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
