# Simli Avatar Setup

## Quick Start

### 1. Configure API Key

Copy `.env.example` to `.env` and add your Simli API key:

```bash
cp .env.example .env
```

Edit `.env` and set:
```
VITE_SIMLI_API_KEY=your_actual_simli_api_key
```

### 2. Development Mode

By default, avatars show as gradient placeholders in development to avoid 500 errors.

To enable live Simli integration in dev:
- Edit `src/config/env.ts`
- Change `IS_SIMLI_LIVE = import.meta.env.PROD || false` to `true`

### 3. Production Mode

In production, Simli automatically loads. The iframe URLs include all required parameters:
- `faceId` - Simli face identifier
- `agentId` - Simli agent identifier
- API key is loaded from environment variable

## No Backend Required

The Simli integration pages (`simli-agent.html`, `simli-rag-agent.html`) are **self-contained**:
- All configuration comes from URL query parameters
- No `/api/avatar/config` endpoint needed
- API key loaded from `VITE_SIMLI_API_KEY` environment variable

## Avatar Configuration

Avatar URLs are configured in `src/config/avatars.ts`:

```typescript
{
  id: "tax",
  name: "Tax Advisor for Artists",
  simliUrl: `${window.location.origin}/simli-agent.html?id=tax&faceId=afdb6a3e-3939-40aa-92df-01604c23101c&agentId=d951e6dc-c098-43fb-a34f-e970cd339ea6`
}
```

## Troubleshooting

### 500 Errors
If you see 500 errors in development:
1. Make sure `IS_SIMLI_LIVE = false` in `src/config/env.ts`
2. This will show gradient placeholders instead of loading iframes

### API Key Not Found
If you see "Simli API key not configured":
1. Create `.env` file from `.env.example`
2. Add `VITE_SIMLI_API_KEY=your_key`
3. Restart the dev server

### Extension Blocking
If `index.js` is blocked by browser extension:
- Try in incognito mode
- Or whitelist localhost in your ad blocker
