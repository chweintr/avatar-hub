import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
        
        // Map avatar IDs to specific face IDs
        const simliFaceIds: { [key: string]: string } = {
          'tax-specialist': 'afdb6a3e-3939-40aa-92df-01604c23101c',
          // Add more mappings as needed
        };

        config = {
          provider: 'simli',
          apiKey: process.env.SIMLI_API_KEY,
          faceId: simliFaceIds[avatarId] || process.env.SIMLI_FACE_ID
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});