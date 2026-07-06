export function exportChatToTxt(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) return;

  const lines = [`AI Health Assistant — Chat Export\n${'='.repeat(50)}\n`];

  for (const msg of chatHistory) {
    const role = msg.role === 'user' ? 'You' : 'Assistant';
    const time = msg.time || '';
    lines.push(`[${time}] ${role}:\n${msg.content}\n`);
  }

  const exportText = lines.join('\n');
  const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
  link.download = `health_chat_${dateStr}_${timeStr}.txt`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
