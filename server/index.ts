import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve the built frontend files
  const distPath = join(__dirname, '..', 'dist');
  
  // Check if dist directory exists
  if (fs.existsSync(distPath)) {
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
  } else {
    console.error(`Warning: dist directory not found at ${distPath}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple endpoint to get Simli API key (server-side only)
app.get('/api/simli-config', (req, res) => {
  const apiKey = process.env.SIMLI_API_KEY || process.env.VITE_SIMLI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Simli API key not configured on server'
    });
  }

  res.json({ apiKey });
});

// LiveKit token endpoint
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
      help: 'Set these environment variables in Railway or create a .env file locally'
    });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user,
    ttl: '1h'
  });

  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

  res.json({ url, token: await at.toJwt() });
});

// API endpoint to get avatar configuration (provider-agnostic)
app.post('/api/avatar/config', async (req, res) => {
  try {
    const { avatarId, provider } = req.body;
    
    // Validate request
    if (!avatarId || !provider) {
      return res.status(400).json({ error: 'Avatar ID and provider are required' });
    }

    let config: any = {};

    switch (provider) {
      case 'simli':
        if (!process.env.SIMLI_API_KEY) {
          return res.status(500).json({ error: 'Simli not configured' });
        }
        
        // Map avatar IDs to specific face IDs and agent IDs
        const simliFaceIds: { [key: string]: string } = {
          'tax-specialist': 'afdb6a3e-3939-40aa-92df-01604c23101c',
          'grants': 'cace3ef7-a4c4-425d-a8cf-a5358eb0c427',
          // Add more mappings as needed
        };
        
        const simliAgentIds: { [key: string]: string } = {
          'tax-specialist': 'd951e6dc-c098-43fb-a34f-e970cd339ea6',
          // grants doesn't use a Simli agent - it uses RAG backend
          // Add more mappings as needed
        };
        
        const elevenLabsVoiceIds: { [key: string]: string } = {
          'grants': 'OYTbf65OHHFELVut7v2H',
          // Add more voice mappings as needed
        };

        // For Railway deployment with multiple agents
        const faceIdFromEnv = avatarId === 'tax' ? process.env.FACE_ID_1 :
                             avatarId === 'grants' ? process.env.FACE_ID_2 :
                             avatarId === 'brainstormer' ? process.env.FACE_ID_3 :
                             avatarId === 'crit' ? process.env.FACE_ID_4 :
                             process.env.SIMLI_FACE_ID;
        
        config = {
          provider: 'simli',
          apiKey: process.env.SIMLI_API_KEY,
          faceId: simliFaceIds[avatarId] || faceIdFromEnv,
          agentId: simliAgentIds[avatarId] || undefined,
          voiceId: elevenLabsVoiceIds[avatarId] || undefined,
          useRag: avatarId === 'grants' // Flag to indicate RAG usage
        };
        break;

      case 'heygen':
        if (!process.env.HEYGEN_API_KEY) {
          return res.status(500).json({ error: 'HeyGen not configured' });
        }
        
        config = {
          provider: 'heygen',
          apiKey: process.env.HEYGEN_API_KEY,
          avatarId: req.body.providerConfig?.avatarId
        };
        break;

      default:
        return res.status(400).json({ error: 'Unknown provider' });
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error generating avatar config:', error);
    res.status(500).json({ error: 'Failed to generate configuration' });
  }
});

// Keep the original endpoint for backward compatibility
app.post('/api/simli/token', async (req, res) => {
  req.body.provider = 'simli';
  return app._router.handle(req, res);
});

// API endpoint for OpenAI integration
app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, stream = false } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        stream
      })
    });

    if (stream) {
      // For streaming responses, pipe the response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          res.write(chunk);
        }
      }
      res.end();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// API endpoint for ElevenLabs TTS
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voiceId = 'default' } = req.body;
    
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } else {
      throw new Error('ElevenLabs API error');
    }
  } catch (error) {
    console.error('Error in ElevenLabs TTS:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// LiveKit token generation (if needed)
app.post('/api/livekit/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;
    
    // In a real implementation, you'd use the LiveKit SDK to generate tokens
    // For now, we'll return a placeholder
    res.json({
      token: 'livekit-token-placeholder',
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880'
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Failed to generate LiveKit token' });
  }
});

// RAG Backend proxy for Art Grants Expert
app.post('/api/rag/query', async (req, res) => {
  try {
    const { query, avatarId } = req.body;
    
    // Only handle grants avatar
    if (avatarId !== 'grants') {
      return res.status(400).json({ error: 'This endpoint is only for grants avatar' });
    }
    
    const ragBackendUrl = process.env.RAG_BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${ragBackendUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });
    
    if (response.ok) {
      const data = await response.json();
      res.json(data);
    } else {
      throw new Error('RAG backend error');
    }
  } catch (error) {
    console.error('Error in RAG query:', error);
    res.status(500).json({ error: 'Failed to process RAG query' });
  }
});

// WebSocket proxy for RAG backend (for real-time avatar communication)
app.get('/api/rag/ws', (req, res) => {
  const ragBackendUrl = process.env.RAG_BACKEND_URL || 'http://localhost:8000';
  res.json({ 
    wsUrl: ragBackendUrl.replace('http', 'ws') + '/ws/simli'
  });
});

// Catch-all route for SPA - must be after all other routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const distPath = join(__dirname, '..', 'dist');
    res.sendFile(join(distPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(404).send('Frontend build not found. Please run "npm run build" first.');
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});