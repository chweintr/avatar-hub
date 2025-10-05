import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/livekit-token', async (req, res) => {
  const room = String(req.query.room || 'avatar-hub');
  const user = String(req.query.user || `viewer-${Math.random().toString(36).slice(2)}`);

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    const missing = [];
    if (!apiKey) missing.push('LIVEKIT_API_KEY');
    if (!apiSecret) missing.push('LIVEKIT_API_SECRET');
    if (!url) missing.push('LIVEKIT_URL');

    return res.status(500).json({
      error: 'LiveKit configuration missing',
      missing,
      help: 'Set these environment variables in Railway'
    });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user,
    ttl: '1h'
  });

  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

  res.json({ url, token: await at.toJwt() });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
