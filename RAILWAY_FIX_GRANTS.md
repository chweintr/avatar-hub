# Fix Grants Agent RAG Connection on Railway

## What Just Got Fixed (Code Side)
✅ Avatar thumbnails swapped - Tax now shows Indian woman face
✅ Tax agent already using Archana voice
✅ Grants database file committed and pushed to GitHub

## What You Need to Configure on Railway

### Step 1: Check RAG Backend Deployment Status
1. Go to Railway → **cooperative-hope** service
2. Check the latest deployment logs
3. Look for: `ChromaDB initialized with 124 documents`
   - If you see `0 documents` → the rebuild hasn't happened yet, wait 2-3 minutes
   - If still 0 after rebuild → click "Redeploy" manually

### Step 2: Get RAG Backend Internal URL
The worker-grants service needs to connect to the RAG backend using Railway's **internal networking**.

**Option A: Use Railway Internal DNS (Recommended)**
```
RAG_BACKEND_URL=http://cooperative-hope.railway.internal:8000
```

**Option B: Use Private Network URL**
1. Go to cooperative-hope service → Settings → Networking
2. Look for "Private Network URL" (should be something like `cooperative-hope.railway.internal:8000`)
3. Copy that URL

### Step 3: Set Environment Variable on worker-grants
1. Go to Railway → **worker-grants** service → Variables
2. Add or update:
   ```
   RAG_BACKEND_URL=http://cooperative-hope.railway.internal:8000
   ```
3. Click "Redeploy" to apply the change

### Step 4: Verify It's Working
After redeployment, check worker-grants logs for:
```
✓ Connecting to RAG backend at: http://cooperative-hope.railway.internal:8000
✓ Simli avatar started successfully
```

If you see connection errors, check:
- cooperative-hope is deployed and running
- Both services are in the same Railway project
- Railway private networking is enabled for both services

## Testing
1. Go to https://avatar-hub-production.up.railway.app/
2. Click the Grants avatar (should now show the correct face)
3. Click "Connect" and wait 30 seconds for worker to start
4. Ask: "What grants are available for painters?"
5. Should get actual grant recommendations, not "database unavailable" error

## Summary of Railway Services
- **avatar-hub-production**: Frontend + Express backend
- **cooperative-hope**: RAG backend with grants database (124 entries)
- **worker-tax**: Tax advisor agent with Archana voice
- **worker-grants**: Grants agent that queries cooperative-hope

All services should be deployed and running in the same Railway project.
