# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a voice-controlled task management application built with two main components:

1. **Python Backend Agent** (`/agent/`): A LiveKit-based voice assistant that processes speech and manages tasks
2. **Next.js Web Frontend** (`/webapp/`): Provides the user interface and LiveKit integration

### Key Components

- **LiveKit Agent** (`agent/agent.py`): Voice-controlled task management using OpenAI LLM, Deepgram STT, and Silero VAD
- **MongoDB Database**: Stores tasks with support for name, description, deadline, and completion status
- **Next.js Frontend**: React-based UI with LiveKit components for real-time voice interaction
- **Database Layer**: Shared MongoDB connection between Python backend and Next.js frontend

## Development Commands

### Python Backend
```bash
# Install dependencies (requires Python 3.12+)
uv sync

# Run the LiveKit agent
python agent/agent.py

# Development mode (if available)
python -m agent.agent
```

### Next.js Frontend
```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Linting
pnpm lint

# Format code
pnpm format:check
pnpm format:write
```

## Required Environment Setup

Create `.env.local` in the root directory:
```
LIVEKIT_URL="ws://localhost:7880"
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
DEEPGRAM_API_KEY="<your_deepgram_key>"
OPENAI_API_KEY="<your_api_key>"
```

## Database Configuration

- MongoDB running on `localhost:27017`
- Database name: `task-management`
- Collection: `tasks`
- No authentication required for local development

## Key File Locations

- **Agent Entry Point**: `agent/agent.py`
- **Database Operations**: `agent/db.py` (Python) and `webapp/db/tasks.ts` (TypeScript)
- **Custom Types**: `agent/custom_types.py`
- **Frontend Main Page**: `webapp/app/(home)/page.tsx`
- **LiveKit Connection**: `webapp/app/api/connection-details/route.ts`

## Agent Tool Functions

The voice assistant supports these operations:
- `create_task`: Add new tasks with optional deadline and description
- `edit_task`: Modify existing tasks (name, completion status, deadline, description)
- `delete_task`: Remove tasks from the list
- `invalid_request`: Handle non-task-related requests

## Testing

No specific test framework is configured. Check for test files in the codebase before running tests.

## Development Notes

- The agent uses case-insensitive task name matching
- Task names are limited to 38 characters, descriptions to 128 characters
- Frontend uses npm as package manager
- LiveKit server must be running before starting the agent

## Authentication
- JWT Strategy
- Providers include: Google, Twitter

## API Key Validation
1. If a user attempts to activate an agent, a modal will appear and they will be prompted to enter their API keys (for Deepgram, OpenAI, and Cartesia): The Cartesia key will be optional.

2. After each api key entry, and validation, users will be able to select a model from a dropdown. The dropdowns will be populated with predetermined options.

3. After validation is complete, their agent will be activated.

4. If they sign in, their api keys, and model preferences will be retained.