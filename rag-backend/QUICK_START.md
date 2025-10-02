# Quick Start - Deploy RAG Backend to Railway

## What You Need to Do:

### 1. Go to Railway
Open https://railway.app in your browser

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repo: `chweintr/avatar-hub`
- Select the `rag-backend` directory

### 3. Add Your API Key
In Railway dashboard, click on your service, then "Variables" tab, and add:

```
OPENAI_API_KEY=sk-[paste your OpenAI API key here]
```

That's the only required variable! The rest have good defaults.

### 4. Deploy
Railway will automatically start building and deploying your app.

### 5. Get Your URL
Once deployed (takes ~5 minutes), Railway will give you a URL like:
`https://avatar-hub-rag-backend.railway.app`

### 6. Load the Knowledge Base
Open a new terminal and run this command (replace with your Railway URL):

```bash
curl -X POST https://your-app-name.railway.app/ingest
```

This loads all the art grants data into the system.

### 7. Test It!
Try a query:

```bash
curl -X POST https://your-app-name.railway.app/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What grants are available for emerging artists?"}'
```

## That's it! Your art grants expert is ready.

To use with the avatar:
1. Open `rag-backend/examples/simli_client.html` in your browser
2. Enter your Simli API key
3. Update the backend URL to your Railway URL
4. Start chatting with your art grants expert!