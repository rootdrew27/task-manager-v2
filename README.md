# Task Manager V2 (Beta)

A simple web application for managing tasks using only your voice.

## Getting started

1. Create a `.env.local` file and set the following:

```
LIVEKIT_URL="ws://localhost:7880"
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"

DEEPGRAM_API_KEY="<your_deepgram_key>"
OPENAI_API_KEY="<your_api_key>"
```
2. Create a MongoDB database with the name "task-managment" (use default port).

3. Setup a LiveKit Server (or use the livekit cloud). Start the server with:

```
livekit-server --dev
```

4. Open http://localhost:3000 in your browser.
