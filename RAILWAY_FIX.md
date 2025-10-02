# Fixing Railway 404 Error

The "Cannot GET /" error happens when the Express server isn't serving the built React frontend. Here's how to fix it:

## Quick Fix for Railway

### 1. Update Your Railway Service Settings

In your Railway dashboard for the main service:

**Build Command:**
```
npm ci && npm run build
```

**Start Command:**
```
npm start
```

**Environment Variables:**
```
NODE_ENV=production
PORT=${{PORT}}
SIMLI_API_KEY=your-key
OPENAI_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
```

### 2. Deploy Using Dockerfile (Recommended)

If the above doesn't work, use the Dockerfile:

1. In Railway dashboard, go to your service settings
2. Change Builder from "NIXPACKS" to "DOCKERFILE"
3. Deploy again

### 3. Check Build Logs

Look for these in your Railway build logs:
- ✅ "vite build" completing successfully
- ✅ "dist" folder being created
- ✅ Server starting with "Environment: production"

## The Architecture

Your app should work like this:

```
Railway URL (avatar-hub-production.up.railway.app)
    ↓
Express Server (serves both API and static files)
    ↓
├── /api/* → Backend endpoints
├── /health → Health check
└── /* → React frontend (from dist folder)
```

## Debugging Steps

1. **Check if frontend built:**
   ```
   https://your-app.railway.app/health
   ```
   Should return `{"status":"ok"}`

2. **Check build output:**
   Railway logs should show:
   ```
   > vite build
   ✓ 123 modules transformed
   dist/index.html
   dist/assets/...
   ```

3. **Check server logs:**
   Should see:
   ```
   Server running on http://localhost:3001
   Environment: production
   Serving static files from: /app/dist
   ```

## Alternative: Separate Services

If single service doesn't work, deploy as 3 separate Railway services:

1. **frontend** - Just the React app
   - Root Directory: `/`
   - Build: `npm run build`
   - Start: `npm run preview -- --port $PORT --host`

2. **backend** - Express API
   - Root Directory: `/`
   - Start: `npm run server`

3. **rag-backend** - Python service
   - Root Directory: `/rag-backend`
   - Uses Dockerfile

Then update frontend to use backend URL via environment variable.