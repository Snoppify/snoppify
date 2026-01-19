# Snoppify Rewrite - Executive Summary

## Quick Reference

This directory contains comprehensive documentation for rewriting Snoppify from scratch. Use these documents in order:

1. **FEATURE_ANALYSIS.md** - Complete feature breakdown and current implementation details
2. **IMPLEMENTATION_GUIDE.md** - Critical algorithms and patterns that must be preserved
3. **REWRITE_SPECIFICATION.md** - Complete tech stack and architecture for the rewrite
4. **README.md** - Original project README (for reference)

---

## What is Snoppify?

A democratic party music queue app that integrates with Spotify. Multiple users can:
- Search and add songs to a shared queue
- Vote on tracks to reorder the queue
- See who added each song
- Control playback (host only)

**Core Value Proposition:** Keeps party playlists fair and democratic - no one person dominates the music, everyone has a voice through voting.

---

## Current State

### Tech Stack (Current)
- **Frontend:** Vue 2 + Vuex + Vue Router
- **Backend:** Node.js + Express + TypeScript (mixed with JS)
- **Database:** File-based JSON storage
- **Real-time:** Socket.io
- **Authentication:** Passport.js (Spotify, Google, Facebook OAuth)
- **Spotify:** spotify-web-api-node library

### What Works Well
✅ Quick OAuth authentication  
✅ Real-time queue synchronization  
✅ Democratic voting system  
✅ Multi-party support (one server, many parties)  
✅ Spotify playlist management  
✅ State machine for automatic playback  
✅ Per-user track limits  

### Known Issues
❌ Outdated dependencies (Vue 2 EOL, old packages)  
❌ Security vulnerabilities (hardcoded secrets, no rate limiting)  
❌ File-based storage (doesn't scale)  
❌ Mixed JS/TS codebase  
❌ Limited error handling  
❌ No mobile optimization  
❌ No monitoring or logging  

---

## Rewrite Goals

### New Tech Stack
- **Frontend:** React 18 + TypeScript + Panda CSS + Zustand
- **Backend:** Bun + TypeScript + Hono + OpenAPI
- **Database:** PostgreSQL + Redis
- **Real-time:** Socket.io (maintained for compatibility)
- **Type Generation:** OpenAPI → TypeScript (zero manual sync)
- **Build/Test/Package:** All handled by Bun (all-in-one tool)
- **Deployment:** Three options ($0-30/month)

### New Architecture
- ✅ **Simple structure:** `web/` and `server/` (no monorepo)
- ✅ **OpenAPI types:** Auto-generated from backend to frontend
- ✅ **Flexible deployment:** Free cloud, VPS ($4-6), or home server ($0)

### Why These Choices?
- **React:** Best AI tooling support, huge ecosystem, excellent TypeScript integration
- **Bun:** All-in-one tool (runtime + package manager + bundler + test runner), 3x faster than Node.js
- **OpenAPI:** Zero manual type maintenance, compile-time safety across stack
- **PostgreSQL:** Battle-tested, ACID compliance, scales well, powerful query capabilities
- **Redis:** Fast session storage, pub/sub for real-time, excellent caching layer
- **TypeScript:** Type safety across the stack, fewer bugs, better maintainability

---

## Critical Features That Must Work

### 1. Queue Management
- Add tracks with validation (duplicates, user limits)
- Remove own tracks
- Automatic reordering by votes
- Currently playing track always at position 0
- Sync with Spotify playlist

### 2. Voting System
- One vote per user per track
- Toggle vote/unvote
- Cannot vote on own tracks
- Queue reorders automatically after votes
- Real-time updates to all users

### 3. Playback Control
- State machine handles automatic track progression
- Detects track ending (10 seconds before end)
- Falls back to backup playlist when queue empty
- Host controls play/pause/skip
- Device selection and switching

### 4. Real-Time Sync
- Queue changes broadcast instantly
- Playback state updates every 2 seconds
- Vote changes update immediately
- User presence tracking
- No race conditions

### 5. Authentication
- Multiple OAuth providers (Spotify required for host)
- Automatic token refresh (Spotify tokens expire hourly)
- Session persistence across browser restarts
- WebSocket authentication

---

## Critical Algorithms to Preserve

### Queue Reordering
```
Sort order:
1. Currently playing track (always position 0)
2. All other tracks by: vote_count DESC, added_at ASC
3. Update Spotify playlist to match
```

### State Machine
```
States: paused → playing → waitingForNextSong → playSong
- Track ending detected at < 10 seconds remaining
- Empty queue falls back to backup playlist
- All transitions broadcast via Socket.io
```

### Playlist Sync
```
Database is source of truth
→ Calculate diff with Spotify playlist
→ Apply changes (add/remove/reorder)
→ Background job detects and fixes drift
```

### Vote Toggle
```
Check if vote exists
→ If yes: delete vote (unvote)
→ If no: insert vote
→ Update vote count
→ Reorder queue
→ Sync playlist
→ Broadcast update
```

See **IMPLEMENTATION_GUIDE.md** for full code examples.

---

## Migration Plan (12 Week Timeline)

### Weeks 1-2: Foundation
- Monorepo setup with Turborepo
- PostgreSQL + Redis docker setup
- Database schema with Drizzle
- Bun + Hono server scaffold
- React + Vite frontend scaffold

### Weeks 3-4: Backend Core
- Authentication (OAuth providers)
- Party management API
- Queue management API
- Voting system API
- Search API (Spotify proxy)

### Weeks 5-6: Playback & Real-Time
- Spotify integration service
- Playback control API
- State machine implementation
- Socket.io server setup
- Background jobs (polling, token refresh)

### Weeks 7-8: Frontend Core
- Auth flows and guards
- Party creation/selection UI
- Queue display component
- Search interface
- Vote buttons
- Zustand stores

### Weeks 9-10: Frontend Features
- Host dashboard (playback controls, devices)
- Now playing display
- Progress bar
- User presence
- QR code sharing
- Mobile responsive design

### Weeks 11-12: Production Ready
- Unit & integration tests
- E2E tests (Playwright)
- Docker deployment setup
- CI/CD pipeline
- Monitoring & logging
- Security audit
- Performance testing
- Deploy to staging
- Production deployment

---

## Database Schema (High-Level)

```
users
  - id, username, display_name, profile_picture_url
  - auth_provider, auth_provider_id
  - spotify_access_token, spotify_refresh_token, spotify_token_expires_at

parties
  - id, name, host_user_id
  - main_playlist_id, backup_playlist_uri
  - active_device_id, max_tracks_per_user
  - status (active/paused/ended)

tracks
  - id (Spotify track ID), name, artists (JSONB), album (JSONB)
  - duration_ms, spotify_uri, preview_url
  - audio_features (JSONB)

queue
  - id, party_id, track_id, added_by_user_id
  - vote_count, position
  - status (pending/playing/played/removed)
  - added_at, played_at

votes
  - id, queue_id, user_id
  - UNIQUE(queue_id, user_id)

sessions
  - id, user_id, party_id, expires_at, data (JSONB)
```

---

## API Endpoints (Overview)

### Authentication
```
POST /api/auth/login/{provider}
GET  /api/auth/callback/{provider}
POST /api/auth/logout
GET  /api/auth/me
```

### Parties
```
POST   /api/parties
GET    /api/parties
GET    /api/parties/:id
PATCH  /api/parties/:id
DELETE /api/parties/:id
POST   /api/parties/:id/join
```

### Queue
```
GET    /api/parties/:id/queue
POST   /api/parties/:id/queue
DELETE /api/parties/:id/queue/:trackId
POST   /api/parties/:id/queue/:trackId/vote
```

### Playback
```
POST /api/parties/:id/playback/play
POST /api/parties/:id/playback/pause
POST /api/parties/:id/playback/next
GET  /api/parties/:id/playback/devices
POST /api/parties/:id/playback/device
GET  /api/parties/:id/playback/status
```

### Search
```
GET /api/search?q={query}
GET /api/tracks/:id
```

---

## Socket.io Events

### Client → Server
- `join:party(partyId)`
- `leave:party(partyId)`

### Server → Client
- `queue:updated(queue)`
- `playback:updated(state)`
- `vote:changed(trackId, voteCount)`
- `user:joined(user)`
- `user:left(userId)`
- `error(message)`

---

## Security Checklist

✅ Use secure OAuth 2.0 flows  
✅ Store tokens encrypted at rest  
✅ Implement rate limiting  
✅ Validate all inputs with Zod  
✅ Use parameterized queries (ORM)  
✅ CSRF protection  
✅ HTTPS in production (TLS 1.3)  
✅ Secure session cookies (httpOnly, secure, sameSite)  
✅ JWT with short expiry + refresh tokens  
✅ Authenticate WebSocket connections  
✅ Environment variables for secrets  
✅ Audit logging for sensitive operations  

---

## Testing Strategy

### Unit Tests (Bun Test)
- API endpoint handlers
- Business logic (queue ordering, vote counting)
- Database queries
- Spotify service methods
- Utility functions
- Target: 80%+ coverage

### Integration Tests (Bun Test)
- API endpoint flows (auth, queue, vote)
- Database operations
- Socket.io events
- Spotify API integration (mocked)

### E2E Tests (Playwright)
- User login flow
- Join party and add track
- Vote on track and see reorder
- Host controls playback
- Real-time updates across clients

### Bun Test Features
- **Jest-compatible API:** Easy migration from Jest
- **TypeScript/JSX:** Works out-of-the-box
- **Fast:** Concurrent execution in single process
- **Watch mode:** `bun test --watch`
- **Coverage:** `bun test --coverage`
- **Mocking:** Built-in mock utilities
- **DOM testing:** happy-dom included

---

## Performance Targets

- API response time: < 200ms (p95)
- Search response: < 500ms (p95)
- Queue update propagation: < 100ms
- Support 100+ concurrent parties
- Support 50+ users per party
- Handle 1000+ requests/minute

---

## Deployment

### Three Deployment Options

| Option | Cost/Month | Best For |
|--------|------------|----------|
| **Home Server** | $0 | Personal use, local parties |
| **Hetzner VPS** | ~$4 | Budget self-hosting |
| **DigitalOcean** | $6 | Simple VPS |
| **Railway Free** | $0 ($5 credit) | MVP testing |
| **Vercel + Railway** | ~$25-30 | Production, no DevOps |

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete instructions.

### Quick Deploy (Self-Hosted)

```bash
# Clone and configure
git clone https://github.com/yourusername/snoppify.git
cd snoppify
cp .env.example .env.prod
nano .env.prod  # Add your settings

# Deploy with one command
docker compose -f docker-compose.prod.yml up -d

# Caddy automatically handles HTTPS!
```

### Development
```bash
docker compose up  # Starts PostgreSQL, Redis, server, web
```

### OpenAPI Type Generation

```bash
# Generate types from backend API
bun run generate  # Runs generate:openapi then generate:client
```

---

## Pro Features (Future Roadmap)

After rewrite completion, build:

1. **User Profiles & History**
   - Track listening history
   - User stats and achievements
   - Favorite tracks

2. **Party Analytics**
   - Play history and stats
   - Most voted tracks
   - Export playlist to Spotify

3. **Advanced Queue Management**
   - Genre/mood filters
   - Host veto power
   - Explicit content filtering
   - AI recommendations

4. **Monetization**
   - Free tier (limited parties)
   - Pro tier (unlimited, analytics, custom branding)
   - Business tier (multi-host, white-label)
   - Stripe integration

5. **Mobile Apps**
   - React Native iOS/Android
   - Native notifications
   - NFC quick join

6. **Admin Dashboard**
   - Party management
   - User moderation
   - System health monitoring
   - Usage analytics

---

## Success Criteria

### Technical
- ✅ All features from old version working
- ✅ API response times < 200ms (p95)
- ✅ 99.9% uptime
- ✅ Zero critical security vulnerabilities
- ✅ Zero data loss

### User Experience
- ✅ Login completion rate > 90%
- ✅ Track add success rate > 95%
- ✅ Average session > 30 minutes
- ✅ Vote engagement > 50%
- ✅ Mobile usability score > 80

### Business
- ✅ Support 10+ concurrent parties
- ✅ Average party size > 5 users
- ✅ User retention > 60%

---

## Key Contacts & Resources

### Documentation Files
1. `FEATURE_ANALYSIS.md` - What the app does and how
2. `IMPLEMENTATION_GUIDE.md` - Critical code patterns
3. `REWRITE_SPECIFICATION.md` - Full rewrite plan
4. `README.md` - Original setup instructions

### Spotify API
- [Web API Reference](https://developer.spotify.com/documentation/web-api)
- [Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
- [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)

### Libraries
- [React](https://react.dev/)
- [Bun](https://bun.sh/)
- [Hono](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Socket.io](https://socket.io/)

---

## Quick Start (For AI Agents)

When implementing the rewrite:

1. **Start with FEATURE_ANALYSIS.md** to understand what the app does
2. **Read IMPLEMENTATION_GUIDE.md** for critical algorithms
3. **Follow REWRITE_SPECIFICATION.md** for tech choices and architecture
4. **Implement features in this order:**
   - Database schema
   - Authentication
   - Party management
   - Queue management (with validation)
   - Voting system
   - Spotify integration
   - State machine
   - Real-time events
   - Frontend components

5. **Test each feature thoroughly before moving to next**
6. **Preserve the queue reordering, state machine, and playlist sync logic exactly**

---

## Common Pitfalls to Avoid

❌ Don't skip database transactions for queue operations  
❌ Don't broadcast events before database commits  
❌ Don't forget to refresh Spotify tokens automatically  
❌ Don't allow currently playing track to be removed  
❌ Don't sort queue in application code (use SQL ORDER BY)  
❌ Don't forget to sync Spotify playlist after queue changes  
❌ Don't allow users to vote on their own tracks  
❌ Don't forget to handle empty queue (backup playlist fallback)  
❌ Don't store secrets in code or logs  
❌ Don't forget CORS configuration for production  

---

## Questions?

Refer to the detailed documentation files in this repository. Each document provides comprehensive information about different aspects of the rewrite.

**Good luck building the new Snoppify! 🎵🎉**
