# Snoppify Rewrite Specification

## Overview

This document specifies the requirements and approach for a complete rewrite of Snoppify using modern technologies while preserving all core functionality. The goal is to create a production-ready, scalable application that can be hosted commercially while maintaining the simplicity and fun of the original.

---

## Technology Stack

### Frontend
**React 18+ with TypeScript**
- **Why React:** Excellent AI tooling support, massive ecosystem, strong TypeScript integration
- **Why TypeScript:** Type safety, better IDE support, fewer runtime errors
- **UI Framework:** Shadcn/ui + Radix UI (accessible, customizable components)
- **Styling:** Tailwind CSS (utility-first, fast development)
- **State Management:** Zustand (lightweight, simple, TypeScript-first)
- **Routing:** React Router v6 (standard, well-supported)
- **Real-Time:** Socket.io client
- **HTTP Client:** Axios with interceptors
- **Build Tool:** Vite (fast dev server, optimized builds) or Bun's bundler for production

### Backend
**Bun + TypeScript**
- **Why Bun:** Fast runtime, built-in TypeScript support, excellent performance, modern APIs
- **Why TypeScript:** Type safety across the stack, shared types with frontend
- **Framework:** Hono (ultrafast, lightweight, edge-compatible)
- **Real-Time:** Socket.io for backward compatibility
- **Authentication:** Better-auth or Lucia (modern, secure)
- **Database ORM:** Drizzle ORM (lightweight, type-safe, SQL-first)
- **Validation:** Zod (runtime type validation)
- **API Documentation:** OpenAPI/Swagger via Hono OpenAPI

### Database
**PostgreSQL with Redis**
- **PostgreSQL:** Primary data store (users, parties, queues, settings)
- **Redis:** Session storage, real-time pub/sub, caching
- **Why:** Both are battle-tested, scalable, and support advanced features needed for growth

### Infrastructure & DevOps
- **Containerization:** Docker + Docker Compose
- **Environment:** Dotenv for local, proper secrets management for production
- **Monitoring:** Pino logger + optional Sentry for errors
- **Testing:** Bun's built-in test runner (Jest-compatible, fast) + Playwright for E2E
- **CI/CD:** GitHub Actions with Bun
- **Deployment:** Docker containers, deployable to any platform (Railway, Fly.io, AWS, etc.)

### Development Tools (All-in-One with Bun)
- **Package Manager:** Bun (fast, built-in, npm-compatible)
- **Monorepo:** Bun Workspaces (native, no extra tools needed)
- **Build Tool:** Bun's bundler (faster than esbuild, built-in)
- **Test Runner:** Bun test (Jest-compatible, TypeScript/JSX out-of-the-box)
- **Code Quality:** ESLint + Prettier + TypeScript strict mode
- **Git Hooks:** Husky + lint-staged
- **API Testing:** Bruno or Thunder Client (team-friendly, git-based)

---

## Architecture

### High-Level Structure
```
snoppify/
├── apps/
│   ├── web/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── stores/      # Zustand stores
│   │   │   ├── lib/         # Utilities, API clients
│   │   │   ├── types/       # TypeScript types
│   │   │   └── pages/       # Page components
│   │   └── package.json
│   └── server/              # Bun backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── services/    # Business logic
│       │   ├── db/          # Database schema & queries
│       │   ├── auth/        # Authentication logic
│       │   ├── spotify/     # Spotify integration
│       │   ├── realtime/    # Socket.io handlers
│       │   └── types/       # TypeScript types
│       └── package.json
├── packages/
│   └── shared/              # Shared types, utilities
│       ├── src/
│       │   ├── types/       # Shared TypeScript types
│       │   └── utils/       # Shared utilities
│       └── package.json
├── docker-compose.yml       # Local development stack
├── Dockerfile               # Production container
├── package.json             # Root package.json with workspaces
└── bun.lockb                # Bun lockfile
```

### Database Schema (High-Level)

**Users Table:**
```sql
users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_picture_url TEXT,
  auth_provider TEXT NOT NULL, -- 'spotify', 'google', 'facebook'
  auth_provider_id TEXT NOT NULL,
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  spotify_token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Parties Table:**
```sql
parties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host_user_id TEXT REFERENCES users(id),
  main_playlist_id TEXT,
  backup_playlist_id TEXT,
  backup_playlist_uri TEXT,
  active_device_id TEXT,
  max_tracks_per_user INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'ended'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Tracks Table:**
```sql
tracks (
  id TEXT PRIMARY KEY, -- Spotify track ID
  name TEXT NOT NULL,
  artists JSONB NOT NULL,
  album JSONB NOT NULL,
  duration_ms INTEGER NOT NULL,
  spotify_uri TEXT NOT NULL,
  preview_url TEXT,
  audio_features JSONB, -- cached audio features
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Queue Table:**
```sql
queue (
  id SERIAL PRIMARY KEY,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  track_id TEXT REFERENCES tracks(id),
  added_by_user_id TEXT REFERENCES users(id),
  vote_count INTEGER DEFAULT 0,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'playing', 'played', 'removed'
  added_at TIMESTAMP DEFAULT NOW(),
  played_at TIMESTAMP
)
```

**Votes Table:**
```sql
votes (
  id SERIAL PRIMARY KEY,
  queue_id INTEGER REFERENCES queue(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(queue_id, user_id) -- One vote per user per track
)
```

**Sessions Table:**
```sql
sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  party_id TEXT REFERENCES parties(id),
  expires_at TIMESTAMP NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Redis Structure
- **Sessions:** `session:{sessionId}` → session data
- **Party State:** `party:{partyId}:state` → current playback state
- **Active Users:** `party:{partyId}:users` → Set of active user IDs
- **Real-time Events:** Pub/sub channels for party updates

---

## Core Features Implementation

### 1. Authentication System

**Requirements:**
- Support Spotify, Google, Facebook OAuth
- Secure token storage and refresh
- Quick guest access flow
- Session management across HTTP and WebSocket

**Implementation:**
- Use Better-auth or Lucia for OAuth providers
- Store refresh tokens encrypted in PostgreSQL
- Use Redis for session storage (fast lookups)
- JWT tokens for API authentication
- Socket.io middleware validates JWT
- Background job refreshes Spotify tokens before expiry

**API Endpoints:**
```
POST /api/auth/login/spotify
POST /api/auth/login/google
POST /api/auth/login/facebook
GET  /api/auth/callback/spotify
GET  /api/auth/callback/google
GET  /api/auth/callback/facebook
POST /api/auth/logout
GET  /api/auth/me
```

### 2. Party Management

**Requirements:**
- Create parties with unique IDs
- Configure party settings (name, max tracks, backup playlist)
- List user's parties
- Switch between parties
- End/archive parties

**Implementation:**
- Party creation inserts into `parties` table
- Host association via `host_user_id`
- Party settings editable by host only
- Soft delete for ended parties (status = 'ended')
- Query active parties efficiently with indexes

**API Endpoints:**
```
POST   /api/parties              - Create party
GET    /api/parties              - List user's parties
GET    /api/parties/:id          - Get party details
PATCH  /api/parties/:id          - Update party settings
DELETE /api/parties/:id          - End party
POST   /api/parties/:id/join     - Join a party
```

### 3. Queue Management

**Requirements:**
- Add tracks to queue (with validations)
- Remove own tracks
- Real-time queue updates
- Vote-based ordering
- Per-user track limits
- Duplicate prevention

**Implementation:**
- Transaction-based queue operations (PostgreSQL ACID)
- Vote count maintained via JOIN with votes table
- Queue reordering: `ORDER BY vote_count DESC, added_at ASC`
- Background job syncs queue with Spotify playlist
- Socket.io broadcasts queue changes
- Redis cache for queue state (fast reads)

**API Endpoints:**
```
GET    /api/parties/:id/queue          - Get current queue
POST   /api/parties/:id/queue          - Add track to queue
DELETE /api/parties/:id/queue/:trackId - Remove track from queue
GET    /api/parties/:id/queue/history  - Get play history
```

### 4. Voting System

**Requirements:**
- One vote per user per track
- Toggle vote/unvote
- Cannot vote on own tracks
- Queue reorders automatically
- Vote count visible

**Implementation:**
- INSERT with ON CONFLICT for vote toggling
- Trigger updates vote_count on votes table changes
- Real-time broadcast on vote changes
- Queue reorder logic in database query (no app-level sorting)

**API Endpoints:**
```
POST   /api/parties/:id/queue/:trackId/vote   - Vote/unvote track
GET    /api/parties/:id/queue/:trackId/votes  - Get voters
```

### 5. Search

**Requirements:**
- Search Spotify tracks
- Support Spotify URLs/URIs
- Show if track already in queue
- Fast response times

**Implementation:**
- Proxy to Spotify Web API
- Cache results in Redis (short TTL)
- Extract IDs from URLs/URIs server-side
- Annotate results with queue status
- Rate limiting to prevent API abuse

**API Endpoints:**
```
GET /api/search?q={query}&type=track  - Search tracks
GET /api/tracks/:id                   - Get track details
```

### 6. Playback Control

**Requirements:**
- Play/pause/skip controls (host only)
- Device selection
- Automatic track progression
- Backup playlist fallback
- Real-time progress updates

**Implementation:**
- Spotify Playback API calls (play, pause, skip)
- State machine for playback states (port existing logic)
- Polling service checks playback state every 2 seconds
- Queue progression: mark as 'played', play next
- Socket.io broadcasts playback state
- Redis stores current playback state

**API Endpoints:**
```
POST /api/parties/:id/playback/play     - Start playback
POST /api/parties/:id/playback/pause    - Pause playback
POST /api/parties/:id/playback/next     - Skip to next track
POST /api/parties/:id/playback/previous - Previous track
GET  /api/parties/:id/playback/devices  - List devices
POST /api/parties/:id/playback/device   - Set active device
GET  /api/parties/:id/playback/status   - Current playback status
```

### 7. Real-Time Communication

**Requirements:**
- Real-time queue updates
- Playback status updates
- User presence
- Vote notifications

**Implementation:**
- Socket.io rooms per party (`party:{partyId}`)
- Events: `queue:update`, `playback:update`, `vote:change`, `user:join`, `user:leave`
- Redis pub/sub for multi-server support
- Presence tracking in Redis Sets
- Heartbeat mechanism for connection health

**Socket Events:**
```
Client → Server:
  join:party(partyId)
  leave:party(partyId)

Server → Client:
  queue:updated(queue)
  playback:updated(state)
  vote:changed(trackId, voteCount)
  user:joined(user)
  user:left(userId)
  error(message)
```

### 8. Spotify Integration Service

**Requirements:**
- Manage Spotify API clients per user/party
- Token refresh automation
- Playlist CRUD operations
- Playback control
- Search and track details

**Implementation:**
- `SpotifyService` class manages API clients
- Token refresh scheduled via background job (check every minute)
- Playlist sync job keeps Spotify playlist in sync with queue
- Error handling for expired tokens, device issues
- Rate limiting and retry logic

**Key Classes:**
```typescript
class SpotifyService {
  async getClient(userId: string): Promise<SpotifyAPI>
  async refreshToken(userId: string): Promise<void>
  async search(query: string): Promise<Track[]>
  async getTrack(trackId: string): Promise<Track>
  async getAudioFeatures(trackId: string): Promise<AudioFeatures>
}

class PlaybackService {
  async play(partyId: string, trackUri?: string): Promise<void>
  async pause(partyId: string): Promise<void>
  async skip(partyId: string): Promise<void>
  async getDevices(userId: string): Promise<Device[]>
  async setDevice(userId: string, deviceId: string): Promise<void>
  async getCurrentState(userId: string): Promise<PlaybackState>
}

class PlaylistService {
  async createPlaylist(userId: string, name: string): Promise<Playlist>
  async addTracks(playlistId: string, trackUris: string[]): Promise<void>
  async removeTracks(playlistId: string, trackUris: string[]): Promise<void>
  async reorderPlaylist(playlistId: string, trackUris: string[]): Promise<void>
}
```

### 9. Queue Synchronization Service

**Requirements:**
- Keep Spotify playlist in sync with queue
- Handle concurrent modifications
- Automatic recovery from errors
- Maintain correct track order

**Implementation:**
- Background job runs every 5 seconds
- Compare queue table with Spotify playlist
- Calculate diff (add/remove/reorder operations)
- Apply changes to Spotify playlist
- Optimistic locking to prevent race conditions
- Retry mechanism for failures

**Algorithm:**
```typescript
async syncPlaylistWithQueue(partyId: string) {
  const queue = await getQueue(partyId)
  const playlist = await getSpotifyPlaylist(partyId)
  
  const diff = calculateDiff(queue, playlist)
  
  if (diff.toRemove.length > 0) {
    await removeTracks(diff.toRemove)
  }
  
  if (diff.toAdd.length > 0) {
    await addTracks(diff.toAdd)
  }
  
  if (diff.reorder) {
    await reorderPlaylist(queue.map(t => t.spotifyUri))
  }
}
```

### 10. Background Jobs

**Requirements:**
- Token refresh automation
- Playlist synchronization
- Playback state polling
- Cleanup of old data

**Implementation:**
- Use `node-cron` or Bun's built-in timers
- Jobs:
  - **Token Refresh:** Every 30 minutes, refresh tokens expiring within 10 minutes
  - **Playlist Sync:** Every 5 seconds per active party
  - **Playback Poll:** Every 2 seconds per active party
  - **Session Cleanup:** Daily, remove expired sessions
  - **Party Cleanup:** Daily, archive inactive parties (no activity in 24h)

---

## Frontend Architecture

### State Management (Zustand)

**Stores:**
```typescript
// authStore.ts
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (provider: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

// partyStore.ts
interface PartyStore {
  currentParty: Party | null
  parties: Party[]
  joinParty: (partyId: string) => Promise<void>
  createParty: (name: string) => Promise<Party>
  updateParty: (partyId: string, updates: Partial<Party>) => Promise<void>
  loadParties: () => Promise<void>
}

// queueStore.ts
interface QueueStore {
  queue: QueueItem[]
  currentTrack: QueueItem | null
  addTrack: (trackId: string) => Promise<void>
  removeTrack: (trackId: string) => Promise<void>
  vote: (trackId: string) => Promise<void>
  unvote: (trackId: string) => Promise<void>
}

// playbackStore.ts
interface PlaybackStore {
  isPlaying: boolean
  progress: number
  duration: number
  devices: Device[]
  activeDevice: Device | null
  play: () => Promise<void>
  pause: () => Promise<void>
  skip: () => Promise<void>
  setDevice: (deviceId: string) => Promise<void>
}

// searchStore.ts
interface SearchStore {
  query: string
  results: Track[]
  isLoading: boolean
  search: (query: string) => Promise<void>
  clearResults: () => void
}
```

### Component Structure

**Pages:**
- `/` - Landing/Welcome page
- `/login` - Auth provider selection
- `/party` - Main party view (queue, now playing)
- `/party/:id` - Specific party view
- `/host` - Host dashboard
- `/track/:id` - Track details
- `/search` - Search interface

**Core Components:**
- `<AuthGuard>` - Protects authenticated routes
- `<PartyLayout>` - Layout with header, sidebar
- `<NowPlaying>` - Current track display
- `<QueueList>` - Scrollable queue
- `<TrackItem>` - Individual track with vote button
- `<SearchBar>` - Search input with dropdown
- `<PlaybackControls>` - Play/pause/skip buttons (host only)
- `<DeviceSelector>` - Dropdown for Spotify devices
- `<VoteButton>` - Vote/unvote with count
- `<UserAvatar>` - User profile picture
- `<QRCodeModal>` - Party sharing QR codes

### Routing & Guards

```typescript
const routes = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  {
    path: '/party',
    element: <AuthGuard><PartyLayout /></AuthGuard>,
    children: [
      { index: true, element: <PartyHome /> },
      { path: ':id', element: <PartyView /> },
      { path: 'host', element: <HostDashboard /> },
    ]
  },
  { path: '/track/:id', element: <TrackDetails /> },
  { path: '*', element: <NotFound /> },
]
```

### Real-Time Integration

```typescript
// hooks/useSocket.ts
function useSocket(partyId: string) {
  const socket = useRef<Socket>()
  const queueStore = useQueueStore()
  const playbackStore = usePlaybackStore()
  
  useEffect(() => {
    socket.current = io(SERVER_URL, {
      auth: { token: getAuthToken() }
    })
    
    socket.current.emit('join:party', partyId)
    
    socket.current.on('queue:updated', (queue) => {
      queueStore.setQueue(queue)
    })
    
    socket.current.on('playback:updated', (state) => {
      playbackStore.setState(state)
    })
    
    return () => {
      socket.current.emit('leave:party', partyId)
      socket.current.disconnect()
    }
  }, [partyId])
  
  return socket.current
}
```

---

## Security Requirements

### 1. Authentication & Authorization
- Use secure OAuth 2.0 flows
- Store tokens encrypted at rest
- Implement CSRF protection
- Use secure session cookies (httpOnly, secure, sameSite)
- JWT tokens with short expiry (15 minutes)
- Refresh tokens with long expiry (30 days)

### 2. API Security
- Rate limiting on all endpoints (express-rate-limit)
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries via ORM)
- XSS prevention (sanitize user inputs)
- CORS configuration (whitelist allowed origins)

### 3. Data Protection
- Encrypt sensitive data at rest (tokens, personal info)
- Use HTTPS in production (TLS 1.3)
- Environment variables for secrets
- No secrets in code or logs
- Audit logging for sensitive operations

### 4. WebSocket Security
- Authenticate socket connections
- Validate party access before joining rooms
- Rate limit socket events
- Sanitize all broadcasted data

---

## Performance Requirements

### 1. Response Times
- API endpoints: < 200ms (p95)
- Search: < 500ms (p95)
- Queue updates: < 100ms propagation
- Playback state: < 2s update frequency

### 2. Scalability
- Support 100+ concurrent parties
- Support 50+ users per party
- Handle 1000+ requests/minute
- Database connection pooling
- Redis caching for hot data

### 3. Optimization Strategies
- Database indexes on frequently queried fields
- Redis cache for queue state
- Debounce real-time updates
- Lazy load track details
- Pagination for large lists
- Image optimization (WebP, lazy loading)

---

## Testing Strategy

### 1. Unit Tests
- Utility functions
- API endpoint handlers
- Business logic (queue ordering, vote counting)
- Database queries
- Spotify service methods
- Target: 80%+ coverage

### 2. Integration Tests
- API endpoint flows
- Database operations
- Socket.io events
- Spotify API integration (mocked)
- Authentication flows

### 3. End-to-End Tests
- User can log in
- User can join party
- User can search and add track
- User can vote on track
- Host can control playback
- Queue updates in real-time

### 4. Testing Tools
- **Bun test:** Built-in test runner (Jest-compatible API, TypeScript/JSX support)
  - Fast execution with concurrent tests
  - Watch mode with `--watch` flag
  - Coverage reports with `--coverage` flag
  - Mocking utilities built-in
  - DOM testing with happy-dom (included)
- **Playwright:** E2E browser tests
- **MSW:** API mocking for integration tests
- **@faker-js/faker:** Test data generation

---

## Deployment & DevOps

### Development Environment
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: snoppify_dev
      POSTGRES_USER: snoppify
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  server:
    build: ./apps/server
    environment:
      DATABASE_URL: postgresql://snoppify:password@postgres/snoppify_dev
      REDIS_URL: redis://redis:6379
      SPOTIFY_CLIENT_ID: ${SPOTIFY_CLIENT_ID}
      SPOTIFY_CLIENT_SECRET: ${SPOTIFY_CLIENT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  web:
    build: ./apps/web
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
```

### Production Deployment
1. **Build Docker images:**
   - Multi-stage builds for optimization
   - Separate images for web and server
   
2. **Environment Configuration:**
   - Use secrets management (e.g., Doppler, AWS Secrets Manager)
   - Environment-specific config files
   
3. **Database Migration:**
   - Drizzle migrations in CI/CD pipeline
   - Rollback strategy
   
4. **Monitoring:**
   - Application logs (Pino + log aggregation)
   - Error tracking (Sentry)
   - Performance monitoring (optional: New Relic, DataDog)
   - Uptime monitoring (Uptime Robot, Pingdom)

5. **Scaling:**
   - Horizontal scaling with load balancer
   - Redis for session sharing across instances
   - Database read replicas for heavy read load
   - CDN for static assets

---

## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up monorepo structure
- [ ] Configure development environment
- [ ] Set up PostgreSQL + Redis
- [ ] Implement database schema with Drizzle
- [ ] Set up Bun + Hono server
- [ ] Set up React + Vite frontend
- [ ] Configure ESLint, Prettier, TypeScript

### Phase 2: Authentication (Week 3)
- [ ] Implement OAuth providers (Spotify, Google, Facebook)
- [ ] Set up session management
- [ ] Implement JWT tokens
- [ ] Create login/logout flows
- [ ] Add auth guards and middleware

### Phase 3: Core Backend (Weeks 4-5)
- [ ] Implement party management API
- [ ] Implement queue management API
- [ ] Implement voting system
- [ ] Implement search API (Spotify proxy)
- [ ] Set up Socket.io server
- [ ] Implement Spotify service layer

### Phase 4: Real-Time & Playback (Week 6)
- [ ] Implement real-time party updates
- [ ] Implement playback control API
- [ ] Port state machine logic
- [ ] Implement playlist sync service
- [ ] Implement background jobs (polling, token refresh)

### Phase 5: Frontend Core (Weeks 7-8)
- [ ] Implement authentication UI
- [ ] Implement party selection/creation UI
- [ ] Implement queue display
- [ ] Implement search interface
- [ ] Implement vote buttons
- [ ] Set up Zustand stores

### Phase 6: Frontend Features (Week 9)
- [ ] Implement playback controls (host view)
- [ ] Implement now playing display
- [ ] Implement progress bar
- [ ] Implement device selector
- [ ] Implement user presence
- [ ] Implement QR code sharing

### Phase 7: Testing & Polish (Week 10)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Error handling and edge cases
- [ ] Loading states and user feedback
- [ ] Mobile responsive design

### Phase 8: DevOps & Deployment (Week 11)
- [ ] Dockerize applications
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring and logging
- [ ] Security audit
- [ ] Performance testing
- [ ] Deploy to staging environment

### Phase 9: Production Readiness (Week 12)
- [ ] Final security review
- [ ] Load testing
- [ ] Documentation (API docs, deployment guide)
- [ ] Admin tools (party management, user moderation)
- [ ] Deploy to production
- [ ] Migration plan from old version

---

## Future Enhancements (Post-Rewrite Roadmap)

### Phase 10: Pro Features
- [ ] **User Accounts & Profiles:**
  - User profile pages
  - Track listening history
  - Favorite tracks
  - Stats (tracks added, votes received)
  
- [ ] **Party Analytics:**
  - Play history
  - Most voted tracks
  - User participation stats
  - Export party playlist to Spotify

- [ ] **Advanced Queue Management:**
  - Queue filters (by user, by genre)
  - Track blocking (host veto)
  - Automatic explicit content filtering
  - Genre/mood-based suggestions

- [ ] **Monetization:**
  - Subscription tiers (free/pro/business)
  - Stripe integration
  - Pro features: unlimited parties, custom branding, analytics
  - Business features: multi-host management, white-label option

### Phase 11: Advanced Features
- [ ] **Smart Features:**
  - AI-powered track recommendations
  - Mood-based playlists
  - Collaborative playlist building
  - Track similarity matching

- [ ] **Social Features:**
  - User friends/follows
  - Party discovery (public parties)
  - Share party highlights
  - Integration with social media

- [ ] **Admin Dashboard:**
  - Party management interface
  - User moderation tools
  - System health monitoring
  - Usage analytics
  - Audit logs

- [ ] **Mobile Apps:**
  - React Native iOS/Android apps
  - Native notifications
  - Offline mode (view queue)
  - Quick join via NFC

---

## Success Metrics

### Technical Metrics
- API response time p95 < 200ms
- Zero data loss (queue persistence)
- 99.9% uptime
- < 5s real-time update latency
- Zero critical security vulnerabilities

### User Experience Metrics
- Login completion rate > 90%
- Track add success rate > 95%
- Average session duration > 30 minutes
- Vote engagement rate > 50%
- Mobile usability score > 80

### Business Metrics
- Concurrent active parties > 10
- Average party size > 5 users
- Monthly active users growth
- Subscription conversion rate (future)
- User retention rate > 60%

---

## Risk Mitigation

### Technical Risks
1. **Spotify API Changes:**
   - Mitigation: Abstract Spotify logic into service layer
   - Fallback: Graceful degradation if API features removed

2. **Real-Time Scaling:**
   - Mitigation: Redis pub/sub for multi-server support
   - Fallback: Polling-based updates if WebSockets fail

3. **Data Migration:**
   - Mitigation: Write migration scripts for old data
   - Fallback: Manual data entry for critical parties

4. **Performance:**
   - Mitigation: Load testing before production
   - Fallback: Rate limiting and queue throttling

### Business Risks
1. **User Adoption:**
   - Mitigation: Maintain feature parity with old version
   - Fallback: Run old and new versions in parallel

2. **Complexity Creep:**
   - Mitigation: Start with MVP, iterate based on feedback
   - Fallback: Cut scope to ship on time

---

## Conclusion

This rewrite specification provides a comprehensive plan to modernize Snoppify while preserving its core functionality. The new stack (React + Bun + PostgreSQL + Redis) offers:

1. **Better Performance:** Bun's speed + Redis caching
2. **Scalability:** Database + horizontal scaling
3. **Maintainability:** TypeScript + modern patterns
4. **Developer Experience:** Fast builds, hot reload, great tooling
5. **Production Readiness:** Security, monitoring, deployment automation

The phased migration approach ensures we can deliver incrementally while maintaining the fun, democratic spirit that makes Snoppify special.
