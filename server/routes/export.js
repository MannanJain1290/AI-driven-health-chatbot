import express from 'express';

const router = express.Router();

/**
 * POST /api/export
 * Body: { chatHistory: [{role, content, time}] }
 * Returns: TXT file download
 */
router.post('/', (req, res) => {
  try {
    const { chatHistory = [] } = req.body;

    if (chatHistory.length === 0) {
      return res.status(400).json({ error: 'No chat history to export' });
    }

    const lines = [`AI Health Assistant — Chat Export\n${'='.repeat(50)}\n`];

    for (const msg of chatHistory) {
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      const time = msg.time || '';
      lines.push(`[${time}] ${role}:\n${msg.content}\n`);
    }

    const exportText = lines.join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="health_chat_export.txt"`);
    res.send(exportText);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export chat' });
  }
});

export default router;
