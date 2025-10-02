# Avatar Hub - Dynamic Alpha Projection System

A sophisticated web-based avatar hub featuring AI avatars with alpha projection capabilities, layered particle effects, and seamless interactive video flow. Supports multiple avatar providers including Simli and HeyGen.

## Features

- **Alpha Projection Ready**: Black backgrounds optimized for projection mapping
- **Provider Agnostic**: Support for multiple avatar providers (Simli, HeyGen, custom)
- **Layered Video System**: Dual-layer alpha particle effects (top and bottom)
- **Dynamic Video Flow**: Smooth transitions between idle, interactive, and dismissal states
- **Square Format Display**: Central mount maintains consistent aspect ratio
- **Real-time AI Integration**: GPT-4o conversational AI with ElevenLabs TTS
- **Secure API Management**: Environment-based configuration for all API keys

## Prerequisites

- Node.js 18+ and npm
- Railway account for deployment
- API keys for:
  - Avatar providers (Simli, HeyGen, etc.)
  - OpenAI (GPT-4o)
  - ElevenLabs
  - LiveKit (optional, for cloud deployment)

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run development server:
   ```bash
   npm run dev
   ```

## Railway Deployment

### Environment Variables Setup

When deploying to Railway, configure these environment variables in your project settings:

1. Navigate to your Railway project > Variables tab
2. Add each variable individually with exact formatting:

```
# Avatar Providers
SIMLI_API_KEY=your_simli_api_key_here
SIMLI_FACE_ID=default_simli_face_id_here
SIMLI_TAX_SPECIALIST_FACE_ID=afdb6a3e-3939-40aa-92df-01604c23101c
HEYGEN_API_KEY=your_heygen_api_key_here (optional)

# AI & Voice
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Railway
VITE_API_URL=https://your-railway-domain.railway.app
PORT=${{PORT}}
```

### Deployment Steps

1. Push your code to GitHub
2. Connect your GitHub repository to Railway
3. Railway will automatically:
   - Detect the Node.js project
   - Install dependencies
   - Build both frontend and backend
   - Start the server

## Video Asset Requirements

Place your video assets in the `public/videos/` directory:

- `idle-state.mp4` - Main idle state video
- `particles-bottom.webm` - Bottom layer particles (with alpha channel)
- `particles-top.webm` - Top layer particles (with alpha channel)
- `transition-in-[avatar-id].mp4` - Transition videos for each avatar
- `transition-out-[avatar-id].mp4` - Exit transition videos

For avatar thumbnails, place images in `public/avatars/`:
- `avatar1-thumb.jpg`, `avatar2-thumb.jpg`, etc.

## Project Structure

```
avatar-hub/
├── server/              # Express backend
│   └── index.ts        # API endpoints
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service layer
│   └── types/          # TypeScript definitions
├── agents/             # Python-based avatar agents
│   └── tax-specialist/ # Tax advisor agent
├── public/
│   ├── videos/         # Video assets
│   └── avatars/        # Avatar thumbnails
└── railway.json        # Railway configuration
```

## API Endpoints

- `POST /api/avatar/config` - Get avatar configuration (provider-agnostic)
- `POST /api/simli/token` - Legacy Simli endpoint
- `POST /api/openai/chat` - Chat with GPT-4o
- `POST /api/elevenlabs/tts` - Generate speech
- `POST /api/livekit/token` - Get LiveKit token (if using)

## Security Notes

- Never commit `.env` files to version control
- All API keys are stored as environment variables
- Backend proxies all API requests to prevent key exposure
- CORS is configured for production domains only

## Customization

### Adding New Avatars

1. Update the `MOCK_AVATARS` array in `src/components/AvatarHub.tsx`
2. Add corresponding video files for transitions
3. Add thumbnail images
4. Update provider-specific IDs (face IDs, avatar IDs)

### Supporting New Providers

1. Add provider type to `AvatarProvider` in `src/types/index.ts`
2. Implement provider component (like `SimliAvatar.tsx`)
3. Update `GenericAvatar.tsx` to handle new provider
4. Add backend configuration in `server/index.ts`

### Modifying Particle Effects

Edit the video layer configurations in `AvatarHub.tsx`:
- Adjust opacity values
- Change blend modes
- Add additional layers if needed

## Specialized Agents

### Tax Specialist
- Face ID: `afdb6a3e-3939-40aa-92df-01604c23101c`
- Specialized knowledge for artist tax advice
- Python-based agent in `agents/tax-specialist/`

## Troubleshooting

- **Black screen**: Check that all video files are properly placed in `public/videos/`
- **API errors**: Verify all environment variables are set correctly
- **Video not playing**: Ensure videos are encoded with proper codecs (H.264 for MP4, VP9 for WebM)
- **Avatar not loading**: Check provider-specific API keys and IDs

## License

This project is configured for Railway deployment with secure API management.