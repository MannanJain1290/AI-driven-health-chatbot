import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

export default function ChatContainer({ chatHistory }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div
      ref={containerRef}
      className="chat-container"
      style={{
        maxHeight: '500px',
        overflowY: 'auto',
        paddingRight: '0.5rem',
      }}
    >
      {chatHistory.map((msg, index) => (
        <ChatBubble key={index} message={msg} />
      ))}
    </div>
  );
}
