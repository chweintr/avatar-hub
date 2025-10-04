# Simli Avatar Setup

## Railway Setup (Production)

### 1. Configure API Key in Railway

In your Railway project:
1. Go to **Variables** tab
2. Add: `VITE_SIMLI_API_KEY = your_simli_api_key_here`
3. Redeploy

Get your API key from [Simli Dashboard → API Keys](https://app.simli.ai/settings/api-keys)

### 2. Test After Deploy

Visit your deployed avatars at:
```
https://your-railway-domain.up.railway.app/simli-agent.html?agentId=YOUR_AGENT&faceId=YOUR_FACE
```

## Local Development Setup

### 1. Configure API Key (Optional)

For local testing with live Simli integration:

```bash
cp .env.example .env
```

Edit `.env` and set:
```
VITE_SIMLI_API_KEY=your_actual_simli_api_key
```

### 2. Development Modes

**Default (Recommended):**
- `IS_SIMLI_LIVE = false` in `src/config/env.ts`
- Shows gradient placeholders
- No iframe loading, no API calls, no 500 errors
- Perfect for UI development and screenshots

**Live Testing:**
- Edit `src/config/env.ts`: set `IS_SIMLI_LIVE = true`
- Requires `.env` file with `VITE_SIMLI_API_KEY`
- Loads real Simli iframes in development

## Architecture

### Bundled Iframe Pages

The Simli integration uses **Vite-bundled HTML pages**:

**Files:**
- `simli-agent.html` → Standard Simli agent
- `simli-rag-agent.html` → RAG-powered agent (for Grants Expert)
- `src/iframe/simliAgent.ts` → Bundled TypeScript entry
- `src/iframe/simliRagAgent.ts` → RAG-enabled entry

**Build Configuration:**
```typescript
// vite.config.ts
rollupOptions: {
  input: {
    main: resolve(__dirname, 'index.html'),
    simliAgent: resolve(__dirname, 'simli-agent.html'),
    simliRagAgent: resolve(__dirname, 'simli-rag-agent.html'),
  },
}
```

### Self-Contained Design

**No backend API required:**
- API key: `import.meta.env.VITE_SIMLI_API_KEY` (baked in at build time)
- Configuration: URL query parameters (`faceId`, `agentId`)
- No `/api/avatar/config` endpoint needed

### Avatar URLs

Configured in `src/config/avatars.ts`:

```typescript
{
  id: "tax",
  name: "Tax Advisor for Artists",
  simliUrl: `/simli-agent.html?id=tax&faceId=afdb6a3e-3939-40aa-92df-01604c23101c&agentId=d951e6dc-c098-43fb-a34f-e970cd339ea6`
}
```

## Troubleshooting

### "Missing Simli API key" Error

**In Production (Railway):**
1. Check Railway Variables has `VITE_SIMLI_API_KEY`
2. Redeploy after adding the variable
3. Vite bakes the value into the bundle at build time

**In Development:**
1. Create `.env` file: `cp .env.example .env`
2. Add `VITE_SIMLI_API_KEY=your_key`
3. Restart dev server: `npm run dev`

### 500 Errors in Development

Set `IS_SIMLI_LIVE = false` in `src/config/env.ts` to show placeholders.

### Browser Extension Blocking

If scripts are blocked (ERR_BLOCKED_BY_CLIENT):
- Test in incognito mode
- Whitelist localhost in ad blocker

## Getting Simli IDs

1. **API Key**: [Simli Dashboard → API Keys](https://app.simli.ai/settings/api-keys)
2. **Face ID**: Create/select an avatar face in Simli dashboard
3. **Agent ID**: Create an agent in Simli dashboard (for conversational AI)
