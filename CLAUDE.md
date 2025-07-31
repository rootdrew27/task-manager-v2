# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a voice-controlled task management application built with two main components:

1. **Python Backend Agent** (`/agent/`): A LiveKit-based voice assistant that processes speech and manages tasks
2. **Next.js Web Frontend** (`/webapp/`): Provides the user interface and LiveKit integration

### Key Components

- **LiveKit Agent** (`agent/agent.py`): Voice-controlled task management using OpenAI LLM, Deepgram STT, and Silero VAD
- **Postgres Database**: Stores users and tasks. Tasks contain a name, description, deadline, completion status, and a foreign key of the user's id.
- **Next.js Frontend**: React-based UI with LiveKit components for real-time voice interaction
- **Database Layer**: Shared Postgres connection between Python backend and Next.js frontend

### Other Components

- **Rate Limiting** A sliding window rate limiter with multiple configurations, using redis.
- **Logging** File based, and split into multiple categories (see docs/Logging.md). Enhanced structured logging for agent configuration operations.
- **Development Scripts** Utility scripts in `/scripts/` for maintenance and development automation

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
npm install

# Development server
npm run dev

# Build for production
npm run build

# For anaylzing
npm run analyze

# Linting
npm run lint

# Format code
npm run format:check
npm run format:write
```

### Development Scripts
```bash
# Update CLAUDE.md based on staged git changes
./scripts/update-memory.sh
```

## Required Environment Setup

Create `.env.local` in the root directory:
```
LIVEKIT_URL="ws://<hostname>:<port>"
LIVEKIT_API_KEY=<api_key>
LIVEKIT_API_SECRET=<api_secret>
PG_ENCRYPTION_KEY=<encryption_key_for_api_keys>
```

## Database Configuration

- Postgresql running on `localhost:5432`
- Database name: `postgres`
- Schema name: `task_manager`
- No authentication required for local development
- Uses pgcrypto extension for symmetric encryption of stored API keys
- `encrypt_api_key()` and `decrypt_api_key()` functions available in `task_manager` schema

## Key File Locations

- **Agent Entry Point**: `agent/agent.py`
- **Database Operations**: `agent/db.py` (Python), `webapp/db/tasks.ts` (Tasks), and `webapp/db/agent-config.ts` (API Keys and Model Selection)
- **Custom Types**: `agent/custom_types.py` and `types/`
- **Frontend Main Page**: `webapp/app/(home)/page.tsx`
- **Frontend Main Component**: `webapp/app/(home)/_components/agent.tsx`
- **LiveKit Connection**: `webapp/app/api/connection-details/route.ts`

## Agent Tool Functions

The voice assistant supports these operations:
- `create_task`: Add new tasks
- `edit_task`: Modify existing tasks 
- `delete_task`: Remove tasks from the list
- `invalid_request`: Handle non-task-related requests

- Task are comprised of the following: name, completion status, deadline, description

## Testing

No specific test framework is configured. Check for test files in the codebase before running tests.

## Development Notes

- Frontend uses npm as package manager
- LiveKit server must be running before starting the agent

## Authentication
- JWT Strategy
- Providers include: Google

## API Key Validation
1. If a user attempts to activate an agent, and they have not previously set their api keys or model selections, a modal will appear and they will be prompted to enter their API keys for the folliowng providers: Deepgram, OpenAI, and Cartesia. The Cartesia key will be optional.

2. After api keys are validated, a new modal appears and users will be able to select a model, for each provider, from a dropdown.

3. After the final validation is complete, their agent will be activated.

4. If they are signed in, their api keys, and model preferences will be saved.