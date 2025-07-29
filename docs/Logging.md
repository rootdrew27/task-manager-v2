# Logging
1. Authentication (auth.log)
- OAuth sign-in/sign-out events
- JWT token refresh attempts
- Token validation failures
- User creation/retrieval operations
- Session management events
2. Rate Limiting (rate-limit.log)
- Rate limit violations (429 responses)
- Redis connection issues
- Rate limiter configuration changes
- Client identification problems
3. LiveKit Integration (livekit.log)
- Connection details generation
- Room creation events
- Participant token generation
- WebSocket connection issues
- Audio/voice processing events
4. Database Operations (database.log)
- Task CRUD operations
- User management queries
- Connection pool issues
- Query performance metrics
- Database errors
5. Security (security.log)
- CSP violations
- API key validation attempts
- Internal API access attempts
- Middleware security checks
- Guest user creation tracking
6. Application Errors (errors.log)
- Unhandled exceptions
- API route errors
- Component rendering errors
- Network failures
7. Performance (performance.log)
- Response times
- Resource usage
- Slow queries
- Memory consumption
8. Audit Trail (audit.log)
- User actions (task management)
- Configuration changes
- Admin operations
- System state changes
