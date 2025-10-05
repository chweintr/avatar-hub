# Simli Avatar Setup

## **IMPORTANT: Environment Variables Policy**

**DO NOT store API keys or secrets in local `.env` files.**

- All API keys and secrets live **ONLY in Railway variables**
- The Express server (`/api/simli-config`) serves the API key to the client at runtime
- Local `.env` files should remain empty or contain only non-sensitive config
- This keeps credentials out of git and your local filesystem

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
https://your-railway-domain.up.railway.app/
```

## Local Development Setup

### No Local API Key Required

The app fetches the Simli API key from `/api/simli-config` at runtime, which pulls from Railway environment variables even in local development (when connected to Railway's service).

## Architecture

### In-Page Simli Client

The Simli integration uses an **in-page component** (not iframe):

**Files:**
- `src/components/StageSimli.tsx` → Main Simli client component
- Renders directly in the page with proper user gesture handling
- Fetches API key from `/api/simli-config` at runtime
- No iframe = no cross-origin or permission issues

**Configuration:**
Avatars configured in `src/config/avatars.ts`:

```typescript
{
  id: "tax",
  name: "Tax Advisor for Artists",
  faceId: "afdb6a3e-3939-40aa-92df-01604c23101c",
  agentId: "d951e6dc-c098-43fb-a34f-e970cd339ea6",
  scale: 0.82
}
```

## Troubleshooting

### "Missing Simli API key" Error

**In Railway:**
1. Check Railway Variables has `VITE_SIMLI_API_KEY`
2. Redeploy after adding the variable
3. The Express server at `/api/simli-config` will serve it to the client

**Remember:** Do NOT add the key to local `.env` files. Keys live only in Railway.

### Connect Button Does Nothing

If clicking Connect shows no mic prompt:
1. Check browser console for errors
2. Look at the status text at bottom of circle (shows exact step/error)
3. Ensure HTTPS or localhost (browsers block device access on insecure origins)

### Browser Extension Blocking

If scripts are blocked (ERR_BLOCKED_BY_CLIENT):
- Test in incognito mode
- Whitelist localhost in ad blocker

## Getting Simli IDs

1. **API Key**: [Simli Dashboard → API Keys](https://app.simli.ai/settings/api-keys)
2. **Face ID**: Create/select an avatar face in Simli dashboard
3. **Agent ID**: Create an agent in Simli dashboard (for conversational AI)
