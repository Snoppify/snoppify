# Snoppify Rewrite - Project Roadmap

## Overview

This roadmap provides a detailed, week-by-week plan for rewriting Snoppify. Each phase includes specific tasks, deliverables, and success criteria.

---

## Phase 1: Foundation & Setup (Weeks 1-2)

### Goals
- Set up development environment
- Configure simple directory structure (no monorepo)
- Establish database schema
- Set up build tools and CI/CD

### Week 1: Project Scaffolding

**Day 1-2: Repository Setup**
- [ ] Create new Git repository or branch
- [ ] Set up simple directory structure (web/ and server/)
- [ ] Configure root package.json with convenience scripts only
- [ ] Set up ESLint + Prettier + TypeScript configs
- [ ] Configure Git hooks with Husky
- [ ] Set up GitHub Actions for CI with Bun

**Day 3-4: Development Environment**
- [ ] Create docker-compose.yml for local development
- [ ] Add PostgreSQL 16 container
- [ ] Add Redis 7 container
- [ ] Add pgAdmin container (optional)
- [ ] Create .env.example with all required variables
- [ ] Write development setup documentation

**Day 5: Frontend Scaffold**
- [ ] Create web/ directory
- [ ] Initialize with `bun create vite` for React + TypeScript
- [ ] Install dependencies using Bun: Tailwind, Zustand, React Router, Socket.io client
- [ ] Install `@hey-api/openapi-ts` for client generation
- [ ] Configure Tailwind CSS
- [ ] Set up basic routing structure
- [ ] Create base layout component
- [ ] Add Shadcn/ui components

### Week 2: Backend & Database

**Day 1-2: Backend Scaffold**
- [ ] Create server/ directory
- [ ] Initialize Bun project with `bun init`
- [ ] Install dependencies with Bun: Hono, `@hono/zod-openapi`, Drizzle ORM, Socket.io, Zod
- [ ] Set up Hono app with OpenAPI support
- [ ] Configure CORS, body parser, error handler
- [ ] Set up logger (Pino)
- [ ] Add OpenAPI doc endpoint and Swagger UI

**Day 3-4: Database Schema**
- [ ] Create Drizzle schema files
- [ ] Define users table with indexes
- [ ] Define parties table with indexes
- [ ] Define tracks table with indexes
- [ ] Define queue table with indexes
- [ ] Define votes table with unique constraint
- [ ] Define sessions table
- [ ] Create initial migration with `bun run db:generate`
- [ ] Run migration on local PostgreSQL with `bun run db:migrate`

**Day 5: Testing Infrastructure**
- [ ] Set up Bun test for backend (built-in, no install needed)
- [ ] Set up Bun test for frontend components
- [ ] Set up Playwright for E2E tests
- [ ] Create test database setup/teardown scripts
- [ ] Write first smoke tests with `bun test`

**Deliverables:**
- ✅ Working simple structure with web/ and server/
- ✅ Docker Compose environment running
- ✅ Database schema created and migrated
- ✅ Basic frontend and backend apps running with Bun
- ✅ OpenAPI spec generation working
- ✅ CI/CD pipeline configured with Bun

**Success Criteria:**
- `bun dev` starts both frontend and backend
- `docker-compose up` starts all services
- `bun test` runs all tests in CI
- Database migrations apply successfully with Bun
- `bun run generate` creates OpenAPI spec and typed client

---

## Phase 2: Authentication (Week 3)

### Goals
- Implement OAuth 2.0 for Spotify, Google, Facebook
- Set up session management
- Create login/logout flows
- Implement JWT tokens

### Day 1-2: OAuth Setup
- [ ] Install auth libraries (Better-auth or Lucia)
- [ ] Configure Spotify OAuth strategy
- [ ] Configure Google OAuth strategy
- [ ] Configure Facebook OAuth strategy
- [ ] Create OAuth callback handlers
- [ ] Set up session storage in Redis
- [ ] Implement token encryption for database

### Day 3-4: Auth API & Middleware
- [ ] Create auth routes with `@hono/zod-openapi` annotations
- [ ] Define Zod schemas for auth requests/responses
- [ ] Create POST /api/auth/login/{provider} endpoints
- [ ] Create GET /api/auth/callback/{provider} endpoints
- [ ] Create POST /api/auth/logout endpoint
- [ ] Create GET /api/auth/me endpoint
- [ ] Implement JWT token generation
- [ ] Implement JWT verification middleware
- [ ] Create auth guard middleware for protected routes
- [ ] Generate OpenAPI spec: `bun run generate:openapi`

### Day 5: Frontend Auth
- [ ] Generate TypeScript client: `bun run generate:client`
- [ ] Create auth store (Zustand)
- [ ] Use generated API client for auth calls
- [ ] Create Login page component
- [ ] Create AuthGuard component
- [ ] Implement OAuth redirect flow
- [ ] Implement logout functionality
- [ ] Add token refresh logic
- [ ] Store auth state in localStorage

**Deliverables:**
- ✅ Working OAuth login for all 3 providers
- ✅ Session persistence across browser restarts
- ✅ Protected routes require authentication
- ✅ JWT tokens with refresh mechanism

**Success Criteria:**
- User can log in with Spotify, Google, or Facebook
- Session persists after page refresh
- Logout clears session
- Protected routes redirect to login

**Tests:**
- [ ] Unit: JWT generation and verification
- [ ] Integration: OAuth callback handling
- [ ] E2E: Complete login/logout flow (run with `bun test`)

---

## Phase 3: Party Management (Week 4)

### Goals
- Implement party creation and management
- Build party selection UI
- Set up party joining logic

### Day 1-2: Party API
- [ ] Create POST /api/parties (create party)
- [ ] Create GET /api/parties (list user's parties)
- [ ] Create GET /api/parties/:id (get party details)
- [ ] Create PATCH /api/parties/:id (update settings)
- [ ] Create DELETE /api/parties/:id (end party)
- [ ] Create POST /api/parties/:id/join (join party)
- [ ] Implement party validation (host must have Spotify auth)
- [ ] Add party-level authorization checks

### Day 2-3: Spotify Playlist Creation
- [ ] Create SpotifyService class
- [ ] Implement createPlaylist method
- [ ] Implement getPlaylist method
- [ ] Implement addTracksToPlaylist method
- [ ] Implement removeTracksFromPlaylist method
- [ ] Implement replacePlaylistTracks method
- [ ] Create main playlist on party creation
- [ ] Store playlist ID in parties table

### Day 4-5: Party UI
- [ ] Create party store (Zustand)
- [ ] Create PartyList component
- [ ] Create CreatePartyModal component
- [ ] Create PartyCard component
- [ ] Create JoinParty page
- [ ] Create PartyLayout component
- [ ] Implement party switching
- [ ] Add party settings UI

**Deliverables:**
- ✅ Users can create parties
- ✅ Host gets Spotify playlist created automatically
- ✅ Users can view and join parties
- ✅ Party settings editable by host

**Success Criteria:**
- Party creation generates Spotify playlist
- Party list shows all user's parties
- Joining party loads party data
- Party settings persist

**Tests:**
- [ ] Unit: Party validation logic
- [ ] Integration: Party CRUD operations
- [ ] E2E: Create and join party flow

---

## Phase 4: Queue Management (Week 5)

### Goals
- Implement queue operations with validation
- Build queue reordering logic
- Create queue display UI

### Day 1-2: Queue API
- [ ] Create GET /api/parties/:id/queue
- [ ] Create POST /api/parties/:id/queue (add track)
- [ ] Create DELETE /api/parties/:id/queue/:trackId (remove track)
- [ ] Implement track validation (duplicates, limits)
- [ ] Implement per-user track limit enforcement
- [ ] Create queue reordering function
- [ ] Add transaction handling for queue operations

### Day 2-3: Queue Ordering Logic
- [ ] Implement SQL query for ordered queue
- [ ] Create rebuildQueueOrder function
- [ ] Ensure currently playing track stays at position 0
- [ ] Sort by: status, vote_count DESC, added_at ASC
- [ ] Update queue positions after reorder
- [ ] Test edge cases (empty queue, single track)

### Day 4-5: Queue UI
- [ ] Create queue store (Zustand)
- [ ] Create QueueList component
- [ ] Create TrackItem component
- [ ] Create NowPlaying component
- [ ] Create AddTrack button
- [ ] Implement optimistic UI updates
- [ ] Add loading states
- [ ] Add error handling

**Deliverables:**
- ✅ Users can add tracks to queue
- ✅ Users can remove own tracks
- ✅ Queue respects per-user limits
- ✅ Queue displays in correct order
- ✅ Duplicate prevention works

**Success Criteria:**
- Adding track validates correctly
- Queue order matches vote counts
- Currently playing track stays at top
- User can't exceed track limit

**Tests:**
- [ ] Unit: Queue validation logic
- [ ] Unit: Queue reordering algorithm
- [ ] Integration: Queue CRUD with database
- [ ] E2E: Add and remove track flow

---

## Phase 5: Voting System (Week 6)

### Goals
- Implement vote/unvote functionality
- Build vote button UI
- Handle race conditions correctly

### Day 1-2: Voting API
- [ ] Create POST /api/parties/:id/queue/:trackId/vote
- [ ] Create GET /api/parties/:id/queue/:trackId/votes
- [ ] Implement vote toggle logic (INSERT or DELETE)
- [ ] Add unique constraint validation
- [ ] Update vote_count after vote changes
- [ ] Create database trigger for vote_count updates
- [ ] Call rebuildQueueOrder after votes
- [ ] Add transaction handling

### Day 2-3: Vote Integration
- [ ] Integrate vote changes with queue reordering
- [ ] Validate user can't vote on own tracks
- [ ] Handle concurrent vote requests
- [ ] Test race condition scenarios
- [ ] Add vote count caching in Redis

### Day 4-5: Vote UI
- [ ] Create VoteButton component
- [ ] Show vote count on button
- [ ] Add active state for voted tracks
- [ ] Disable button for own tracks
- [ ] Add animation for vote count changes
- [ ] Implement optimistic updates
- [ ] Handle vote failures gracefully

**Deliverables:**
- ✅ Users can vote/unvote tracks
- ✅ Vote count updates immediately
- ✅ Queue reorders after votes
- ✅ No race conditions on concurrent votes

**Success Criteria:**
- Vote toggles correctly
- Vote count always accurate
- Queue reorders immediately
- Users can't vote on own tracks

**Tests:**
- [ ] Unit: Vote toggle logic
- [ ] Integration: Vote with queue reorder
- [ ] Integration: Concurrent votes (race condition)
- [ ] E2E: Vote and see queue reorder

---

## Phase 6: Search & Spotify Integration (Week 7)

### Goals
- Implement Spotify search proxy
- Build search UI
- Handle track metadata caching

### Day 1-2: Search API
- [ ] Create GET /api/search endpoint
- [ ] Proxy requests to Spotify Web API
- [ ] Parse Spotify URLs/URIs for track IDs
- [ ] Cache search results in Redis (5 min TTL)
- [ ] Annotate results with queue status
- [ ] Implement rate limiting
- [ ] Handle Spotify API errors

### Day 2-3: Track Details
- [ ] Create GET /api/tracks/:id endpoint
- [ ] Fetch track from Spotify
- [ ] Fetch audio features
- [ ] Cache track data in tracks table
- [ ] Create TrackDetails page component

### Day 4-5: Search UI
- [ ] Create search store (Zustand)
- [ ] Create SearchBar component
- [ ] Create SearchResults component
- [ ] Create SearchResultItem component
- [ ] Implement debounced search (300ms)
- [ ] Show loading state during search
- [ ] Display "Add to Queue" button on results

**Deliverables:**
- ✅ Users can search Spotify tracks
- ✅ Search supports text queries and URLs
- ✅ Results show queue status
- ✅ Track details page shows audio features

**Success Criteria:**
- Search returns results < 500ms
- Spotify URLs parsed correctly
- Results show if track in queue
- Track details load correctly

**Tests:**
- [ ] Unit: URL/URI parsing
- [ ] Integration: Search API with caching
- [ ] E2E: Search and add track to queue

---

## Phase 7: Playback Control (Week 8)

### Goals
- Implement Spotify playback API
- Build state machine for playback
- Create host control panel

### Day 1-2: Playback API
- [ ] Create PlaybackService class
- [ ] Implement play method (with device transfer)
- [ ] Implement pause method
- [ ] Implement skip method
- [ ] Implement getDevices method
- [ ] Implement setActiveDevice method
- [ ] Implement getCurrentPlaybackState method
- [ ] Handle 404 (no active device) errors

### Day 2-3: State Machine
- [ ] Port state machine logic from old code
- [ ] Define states: paused, playing, playSong, waitingForNextSong
- [ ] Define transitions with conditions
- [ ] Implement update loop (every 2 seconds)
- [ ] Detect track ending (< 10 seconds remaining)
- [ ] Handle empty queue → backup playlist fallback
- [ ] Mark tracks as 'played' when finished

### Day 4-5: Playback UI
- [ ] Create playback store (Zustand)
- [ ] Create PlaybackControls component (host only)
- [ ] Create DeviceSelector component
- [ ] Create ProgressBar component
- [ ] Create HostDashboard page
- [ ] Show current playback state
- [ ] Display time elapsed / remaining
- [ ] Add backup playlist input

**Deliverables:**
- ✅ Host can control playback (play/pause/skip)
- ✅ State machine handles automatic track progression
- ✅ Device selection works
- ✅ Progress bar updates in real-time

**Success Criteria:**
- Play starts playback on selected device
- Skip moves to next track in queue
- Track ending triggers automatic skip
- Empty queue plays backup playlist

**Tests:**
- [ ] Unit: State machine transitions
- [ ] Integration: Playback API calls
- [ ] Integration: State machine with queue
- [ ] E2E: Host controls playback

---

## Phase 8: Real-Time Communication (Week 9)

### Goals
- Set up Socket.io server
- Implement party rooms
- Broadcast queue and playback updates

### Day 1-2: Socket.io Server
- [ ] Initialize Socket.io on Hono server
- [ ] Implement JWT authentication for sockets
- [ ] Create party room structure (party:{partyId})
- [ ] Handle join:party event
- [ ] Handle leave:party event
- [ ] Handle disconnect event
- [ ] Store userId on socket.data

### Day 2-3: Event Broadcasting
- [ ] Broadcast queue:updated after queue changes
- [ ] Broadcast playback:updated from state machine
- [ ] Broadcast vote:changed after votes
- [ ] Broadcast user:joined when user joins party
- [ ] Broadcast user:left when user leaves/disconnects
- [ ] Implement debouncing for playback updates
- [ ] Send current state to newly joined users

### Day 4-5: Frontend Socket Integration
- [ ] Create useSocket hook
- [ ] Connect to Socket.io on party join
- [ ] Listen for queue:updated events
- [ ] Listen for playback:updated events
- [ ] Listen for vote:changed events
- [ ] Listen for user:joined/left events
- [ ] Update Zustand stores on events
- [ ] Handle reconnection logic

**Deliverables:**
- ✅ Real-time queue updates across clients
- ✅ Playback state synced every 2 seconds
- ✅ Vote changes appear instantly
- ✅ User presence visible

**Success Criteria:**
- Queue changes appear on all clients < 100ms
- Playback progress updates smoothly
- No duplicate events
- Connection survives network blips

**Tests:**
- [ ] Integration: Socket authentication
- [ ] Integration: Event broadcasting to rooms
- [ ] E2E: Multi-client real-time sync

---

## Phase 9: Background Jobs (Week 10)

### Goals
- Implement token refresh automation
- Create playlist sync job
- Build playback polling job

### Day 1-2: Token Refresh Service
- [ ] Create TokenRefreshService class
- [ ] Implement background job (every 5 minutes)
- [ ] Query users with tokens expiring < 10 minutes
- [ ] Refresh tokens using Spotify API
- [ ] Update tokens in database
- [ ] Handle refresh failures gracefully
- [ ] Log token refresh activity

### Day 2-3: Playlist Sync Service
- [ ] Create PlaylistSyncService class
- [ ] Implement background job (every 5 seconds per party)
- [ ] Query active parties
- [ ] For each party: compare queue with playlist
- [ ] Calculate diff (add/remove/reorder)
- [ ] Apply changes to Spotify playlist
- [ ] Handle sync errors without crashing

### Day 4-5: Playback Polling Service
- [ ] Create PlaybackPollingService class
- [ ] Implement background job (every 2 seconds per party)
- [ ] For each active party: poll Spotify playback state
- [ ] Update state machine data
- [ ] Trigger state machine update
- [ ] Broadcast playback:updated event
- [ ] Handle polling errors

**Deliverables:**
- ✅ Tokens refresh automatically before expiry
- ✅ Spotify playlist stays in sync with queue
- ✅ Playback state updates every 2 seconds
- ✅ State machine detects track endings

**Success Criteria:**
- No expired tokens during usage
- Playlist never out of sync > 5 seconds
- Track ending triggers skip within 10 seconds
- All jobs handle errors gracefully

**Tests:**
- [ ] Unit: Token refresh logic
- [ ] Integration: Playlist sync with Spotify API
- [ ] Integration: Playback polling with state machine

---

## Phase 10: Polish & Testing (Week 11)

### Goals
- Write comprehensive tests
- Improve error handling
- Add loading states
- Optimize performance

### Day 1-2: Backend Tests
- [ ] Write unit tests for all services using Bun test
- [ ] Write integration tests for all API endpoints
- [ ] Write tests for queue reordering
- [ ] Write tests for voting system
- [ ] Write tests for state machine
- [ ] Achieve 80%+ code coverage with `bun test --coverage`

### Day 2-3: Frontend Tests
- [ ] Write component tests with Bun test + happy-dom
- [ ] Write store tests for Zustand stores
- [ ] Write hook tests for custom hooks
- [ ] Write E2E tests for critical flows with Playwright:
  - [ ] Login flow
  - [ ] Create/join party
  - [ ] Add track to queue
  - [ ] Vote on track
  - [ ] Host controls playback

### Day 4-5: Polish
- [ ] Add loading states to all async operations
- [ ] Add error messages for all failures
- [ ] Improve mobile responsive design
- [ ] Add animations and transitions
- [ ] Optimize images (WebP, lazy loading)
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility (ARIA labels)

**Deliverables:**
- ✅ 80%+ test coverage
- ✅ All E2E tests passing
- ✅ Error handling on all failure paths
- ✅ Loading states on all async operations
- ✅ Mobile-responsive design

**Success Criteria:**
- All tests pass in CI
- No console errors in production build
- Lighthouse score > 80
- Mobile usability score > 80

---

## Phase 11: DevOps & Deployment (Week 12)

### Goals
- Containerize applications
- Set up CI/CD pipeline
- Deploy to staging and production

### Day 1-2: Docker Setup
- [ ] Write Dockerfile.server for server
- [ ] Write Dockerfile.web for web
- [ ] Create multi-stage builds for optimization
- [ ] Create docker-compose.prod.yml with Caddy
- [ ] Create Caddyfile for automatic HTTPS
- [ ] Test production builds locally
- [ ] Configure environment variables
- [ ] Set up secrets management

### Day 2-3: CI/CD Pipeline
- [ ] Configure GitHub Actions workflow
- [ ] Add linting step
- [ ] Add type checking step
- [ ] Add OpenAPI generation step
- [ ] Add TypeScript client generation step
- [ ] Add unit test step
- [ ] Add E2E test step
- [ ] Add Docker build step
- [ ] Add deploy step (staging)
- [ ] Configure deployment secrets

### Day 4-5: Deployment Options
- [ ] **Option A: Free Cloud** - Set up Vercel + Railway free tier
- [ ] **Option B: VPS** - Deploy to Hetzner/DigitalOcean with Docker Compose
- [ ] **Option C: Home Server** - Configure for self-hosting with Tailscale
- [ ] Set up PostgreSQL database
- [ ] Set up Redis instance
- [ ] Configure DNS and SSL (Caddy handles SSL automatically)
- [ ] Set up monitoring (logs, errors, uptime)
- [ ] Run load tests
- [ ] Monitor for errors

**Deliverables:**
- ✅ Docker containers built and tested
- ✅ CI/CD pipeline fully automated with OpenAPI generation
- ✅ Deployment guide completed
- ✅ At least one deployment option configured
- ✅ Monitoring configured

**Success Criteria:**
- Docker images build successfully
- CI pipeline passes all checks including type generation
- Deployment accessible via HTTPS (Caddy automatic SSL)
- Production handles test load
- Zero downtime during deployment

---

## Post-Launch: Monitoring & Iteration

### Week 13+: Production Monitoring
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance (response times, query times)
- [ ] Monitor uptime (99.9% target)
- [ ] Monitor user metrics (sessions, actions)
- [ ] Gather user feedback
- [ ] Fix critical bugs within 24 hours
- [ ] Prioritize feature requests

### Future Enhancements
- [ ] User profiles and history
- [ ] Party analytics dashboard
- [ ] Advanced queue management (filters, blocking)
- [ ] AI-powered recommendations
- [ ] Subscription tiers and payment
- [ ] Mobile apps (React Native)
- [ ] Admin dashboard
- [ ] Public party discovery

---

## Risk Management

### High-Risk Items
1. **State Machine Complexity**
   - Mitigation: Port exact logic from old code, test thoroughly
   - Fallback: Manual playback controls if automation fails

2. **Spotify API Rate Limits**
   - Mitigation: Implement caching and rate limiting
   - Fallback: Graceful degradation, show cached data

3. **Real-Time Scaling**
   - Mitigation: Use Redis pub/sub for multi-server support
   - Fallback: Polling-based updates if WebSockets fail

4. **Token Refresh Failures**
   - Mitigation: Background job with retry logic
   - Fallback: Prompt user to re-authenticate

### Timeline Risks
- If behind schedule: Cut scope (defer advanced features)
- If ahead: Add polish or start future enhancements

---

## Success Metrics

### Technical
- [ ] API response time p95 < 200ms
- [ ] Real-time update latency < 100ms
- [ ] 99.9% uptime
- [ ] Zero critical security vulnerabilities
- [ ] 80%+ test coverage

### User Experience
- [ ] Login completion rate > 90%
- [ ] Track add success rate > 95%
- [ ] Average session duration > 30 minutes
- [ ] Vote engagement rate > 50%
- [ ] Mobile usability score > 80

### Business
- [ ] Support 10+ concurrent parties
- [ ] Average party size > 5 users
- [ ] User retention rate > 60%

---

## Resources Needed

### Development
- Developers: 1-2 full-time
- Designer: 0.5 part-time (UI/UX polish)
- Time: 12 weeks full-time

### Infrastructure
- PostgreSQL database (managed)
- Redis instance (managed)
- Hosting platform (Railway, Fly.io, AWS, etc.)
- Domain name + SSL certificate
- Monitoring services (Sentry, Uptime Robot)

### APIs & Services
- Spotify Developer Account (free)
- Google OAuth credentials (free)
- Facebook OAuth credentials (free)
- (Optional) Sentry error tracking (free tier available)

---

## Next Steps

1. Review and approve this roadmap
2. Set up development environment (Week 1, Day 1)
3. Begin Phase 1 implementation
4. Daily standup to track progress
5. Weekly sprint review and planning

**Let's build the new Snoppify! 🚀🎵**
