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
- [ ] Install dependencies using Bun: Panda CSS, Park UI, Zustand, React Router, Socket.io client
- [ ] Install `@hey-api/openapi-ts` for client generation
- [ ] Configure Panda CSS with design tokens
- [ ] Set up basic routing structure
- [ ] Create base layout component
- [ ] Add Park UI components (Button, Card, Input, Dialog)

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
- [ ] Create test helpers and factories (createTestUser, createTestParty, etc.)
- [ ] Write first smoke tests with `bun test`
- [ ] Configure coverage thresholds (80%+ overall)
- [ ] Set up test commands in package.json scripts
- [ ] Configure CI to run tests on every PR
- [ ] **Read TESTING_GUIDE.md for comprehensive best practices**

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Unit Tests:**
  - [ ] JWT generation with correct payload
  - [ ] JWT verification (valid/expired/invalid tokens)
  - [ ] Token refresh logic
  - [ ] Session storage/retrieval from Redis
- [ ] **Integration Tests:**
  - [ ] POST /api/auth/login/spotify returns redirect URL
  - [ ] GET /api/auth/callback/spotify creates user session
  - [ ] POST /api/auth/logout clears session
  - [ ] Protected routes return 401 without valid token
  - [ ] Auth middleware attaches user to request context
- [ ] **E2E Tests (Playwright):**
  - [ ] User can click "Login with Spotify" and complete OAuth flow
  - [ ] User session persists after page refresh
  - [ ] User can logout and session is cleared
  - [ ] Protected pages redirect to login when not authenticated
- [ ] **Run:** `bun test` (aim for 80%+ coverage on auth module)

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Unit Tests:**
  - [ ] Party name validation (1-100 characters)
  - [ ] Max tracks per user validation (1-10)
  - [ ] Spotify playlist creation
  - [ ] Party access control (only host can update/delete)
- [ ] **Integration Tests:**
  - [ ] POST /api/parties creates party and Spotify playlist
  - [ ] GET /api/parties returns only user's parties
  - [ ] PATCH /api/parties/:id updates settings (host only)
  - [ ] DELETE /api/parties/:id ends party (host only)
  - [ ] POST /api/parties/:id/join adds user to party
  - [ ] Returns 400 for invalid party data
  - [ ] Returns 403 when non-host tries to update
- [ ] **E2E Tests (Playwright):**
  - [ ] User can create party with custom settings
  - [ ] Spotify playlist appears in host's Spotify account
  - [ ] User can join party via link or code
  - [ ] Party list updates after creating/joining party
  - [ ] Host can update party settings
- [ ] **Run:** `bun test` (aim for 80%+ coverage on party module)

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Unit Tests (100% Coverage - Critical Algorithm):**
  - [ ] Queue reordering: currently playing stays at position 0
  - [ ] Queue reordering: pending tracks sorted by vote_count DESC
  - [ ] Queue reordering: ties broken by added_at ASC
  - [ ] Queue validation: max tracks per user enforced
  - [ ] Queue validation: no duplicate tracks
  - [ ] Queue validation: track must be on Spotify
- [ ] **Integration Tests:**
  - [ ] POST /api/parties/:id/queue adds track to database
  - [ ] GET /api/parties/:id/queue returns ordered queue
  - [ ] DELETE /api/parties/:id/queue/:trackId removes track
  - [ ] Adding track syncs to Spotify playlist
  - [ ] Removing track syncs to Spotify playlist
  - [ ] Returns 400 when user at track limit
  - [ ] Returns 400 for duplicate track
- [ ] **E2E Tests (Playwright):**
  - [ ] User searches and adds track to queue
  - [ ] Track appears in correct position in queue list
  - [ ] User removes own track from queue
  - [ ] Error shown when trying to add 6th track
  - [ ] Queue updates in real-time for other users
- [ ] **Run:** `bun test` (aim for 100% coverage on queue ordering algorithm)

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Unit Tests (100% Coverage - Critical Feature):**
  - [ ] Vote toggle: INSERT vote if not exists
  - [ ] Vote toggle: DELETE vote if exists
  - [ ] Vote count: updates correctly after vote/unvote
  - [ ] Vote validation: user can't vote on own tracks
  - [ ] Vote validation: one vote per user per track
- [ ] **Integration Tests:**
  - [ ] POST /api/parties/:id/queue/:trackId/vote creates vote
  - [ ] POST (again) removes vote (toggle)
  - [ ] Vote count increments/decrements correctly
  - [ ] Queue reorders after vote changes
  - [ ] Transaction rollback on vote failure
  - [ ] **Race condition test:** 100 concurrent votes on same track
  - [ ] **Race condition test:** vote count remains accurate
  - [ ] Returns 400 when voting on own track
- [ ] **E2E Tests (Playwright):**
  - [ ] User clicks upvote button on track
  - [ ] Vote count increments and button shows active state
  - [ ] User clicks upvote again (unvote)
  - [ ] Vote count decrements and button shows inactive state
  - [ ] Queue reorders when track gets more votes
  - [ ] User can't upvote own tracks (button disabled)
- [ ] **Run:** `bun test` (aim for 100% coverage on vote system)

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Unit Tests:**
  - [ ] Spotify URL/URI parsing (all formats)
  - [ ] Search result caching logic
  - [ ] Rate limiting enforcement
  - [ ] Track already in queue detection
- [ ] **Integration Tests:**
  - [ ] GET /api/search returns Spotify results
  - [ ] Search results cached in Redis
  - [ ] Cache expires after TTL
  - [ ] GET /api/tracks/:id fetches and caches track
  - [ ] Search respects rate limits
  - [ ] Handles Spotify API 429 (rate limit) errors
  - [ ] Handles Spotify API 401 (auth) errors
- [ ] **E2E Tests (Playwright):**
  - [ ] User types search query and sees results
  - [ ] Search debounced (doesn't fire immediately)
  - [ ] User pastes Spotify URL and gets track
  - [ ] Results show "Already in queue" for queued tracks
  - [ ] User clicks track to see details page
- [ ] **Run:** `bun test` (aim for 80%+ coverage on search module)

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Unit Tests (100% Coverage - Critical State Machine):**
  - [ ] State transition: paused → playing (on play command)
  - [ ] State transition: playing → waitingForNextSong (< 10s remaining)
  - [ ] State transition: waitingForNextSong → playSong (next track available)
  - [ ] State transition: playSong → playing (playback started)
  - [ ] Handles empty queue → backup playlist
  - [ ] Marks track as 'played' when finished
  - [ ] No infinite loops in state machine
- [ ] **Integration Tests:**
  - [ ] POST /api/parties/:id/playback/play starts playback
  - [ ] POST /api/parties/:id/playback/pause pauses playback
  - [ ] POST /api/parties/:id/playback/skip moves to next track
  - [ ] GET /api/parties/:id/playback/devices returns Spotify devices
  - [ ] State machine polling updates playback state
  - [ ] Track auto-advances when < 10s remaining
  - [ ] Handles no active device gracefully
- [ ] **E2E Tests (Playwright):**
  - [ ] Host clicks play and playback starts on Spotify
  - [ ] Host clicks pause and playback stops
  - [ ] Host clicks skip and next track plays
  - [ ] Progress bar updates in real-time
  - [ ] Track auto-advances when song ends
  - [ ] Backup playlist plays when queue empty
- [ ] **Run:** `bun test` (aim for 100% coverage on state machine)

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Integration Tests:**
  - [ ] Socket connection with JWT authentication
  - [ ] User joins party room successfully
  - [ ] User receives queue:updated event after track added
  - [ ] User receives playback:updated event from state machine
  - [ ] User receives vote:changed event after vote
  - [ ] Multiple users in same room receive same events
  - [ ] User in different room doesn't receive events
  - [ ] Reconnection works after disconnect
- [ ] **E2E Tests (Playwright - Multi-Client):**
  - [ ] User A adds track, User B sees it instantly
  - [ ] User A votes, User B sees vote count update
  - [ ] Host starts playback, all users see progress bar
  - [ ] User joins party, sees current queue and playback state
  - [ ] User disconnects and reconnects, everything still works
- [ ] **Run:** `bun test` (aim for 80%+ coverage on real-time module)

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

**Tests (TDD Approach - Write Tests First):**
- [ ] **Unit Tests (100% Coverage - Critical Background Jobs):**
  - [ ] Token refresh: identifies tokens expiring < 10 min
  - [ ] Token refresh: successfully refreshes token
  - [ ] Token refresh: handles refresh failure gracefully
  - [ ] Playlist sync: calculates correct diff (add/remove/reorder)
  - [ ] Playlist sync: retries on Spotify API failure
  - [ ] Playback polling: detects track ending (< 10s)
  - [ ] Playback polling: doesn't spam state machine
- [ ] **Integration Tests:**
  - [ ] Token refresh job runs every 5 minutes
  - [ ] Tokens updated in database after refresh
  - [ ] Playlist sync job syncs queue to Spotify
  - [ ] Playlist changes reflected on Spotify within 5 seconds
  - [ ] Playback polling updates state machine
  - [ ] All jobs recover from database failures
  - [ ] All jobs recover from Spotify API failures
- [ ] **Run:** `bun test` (aim for 100% coverage on background jobs)

---

## Phase 10: Polish & Testing (Week 11)

### Goals
- Achieve 80%+ code coverage across the codebase
- Write comprehensive E2E tests for all critical flows
- Improve error handling and edge cases
- Add loading states and polish UX
- Optimize performance

### Day 1-2: Backend Tests (Complete Coverage)
- [ ] **Unit Tests:** Write/complete unit tests for all services using Bun test
  - [ ] All utility functions (100% coverage)
  - [ ] Queue reordering algorithm (100% coverage)
  - [ ] Vote system logic (100% coverage)
  - [ ] State machine transitions (100% coverage)
  - [ ] Token refresh logic (100% coverage)
  - [ ] Playlist sync logic (100% coverage)
- [ ] **Integration Tests:** Write/complete integration tests for all API endpoints
  - [ ] All auth endpoints with success/error cases
  - [ ] All party endpoints with validation
  - [ ] All queue endpoints with edge cases
  - [ ] All vote endpoints including race conditions
  - [ ] All search endpoints with caching
  - [ ] All playback endpoints with Spotify integration
- [ ] **Run:** `bun test --coverage` and verify 80%+ backend coverage

### Day 2-3: Frontend Tests (Complete Coverage)
- [ ] **Component Tests:** Write component tests with Bun test + happy-dom
  - [ ] All UI components (Button, Card, Input, Dialog, etc.)
  - [ ] TrackItem component
  - [ ] QueueList component
  - [ ] SearchResults component
  - [ ] PlaybackControls component
  - [ ] VoteButton component
- [ ] **Store Tests:** Write tests for all Zustand stores
  - [ ] Auth store (login/logout/token refresh)
  - [ ] Party store (CRUD operations)
  - [ ] Queue store (add/remove/reorder)
  - [ ] Playback store (play/pause/skip)
  - [ ] Search store (search/cache)
- [ ] **Hook Tests:** Write tests for all custom hooks
  - [ ] useSocket hook (connection/events)
  - [ ] useQueue hook (queue operations)
  - [ ] useVote hook (vote toggle)
  - [ ] usePlayback hook (playback control)
- [ ] **Run:** `bun test --coverage` and verify 70%+ frontend coverage

### Day 3-4: E2E Tests (Critical User Flows)
- [ ] **Setup Playwright:** Configure test database and test accounts
- [ ] **E2E Test Suite:**
  - [ ] **Authentication Flow:**
    - [ ] User logs in with Spotify OAuth
    - [ ] Session persists after page refresh
    - [ ] User logs out successfully
    - [ ] Protected routes redirect when logged out
  - [ ] **Party Management Flow:**
    - [ ] User creates party with custom settings
    - [ ] Spotify playlist created in host's account
    - [ ] User joins party via invite link
    - [ ] Host updates party settings
    - [ ] Host ends party
  - [ ] **Queue & Voting Flow:**
    - [ ] User searches for track
    - [ ] User adds track to queue
    - [ ] Track appears in queue list
    - [ ] User upvotes track
    - [ ] Queue reorders based on votes
    - [ ] User removes own track
    - [ ] User reaches max track limit
  - [ ] **Playback Flow (Host):**
    - [ ] Host selects Spotify device
    - [ ] Host starts playback
    - [ ] Progress bar updates in real-time
    - [ ] Host pauses playback
    - [ ] Host skips to next track
    - [ ] Track auto-advances when song ends
  - [ ] **Real-Time Sync Flow:**
    - [ ] Open two browser windows (User A & B)
    - [ ] User A adds track, User B sees it instantly
    - [ ] User A votes, User B sees vote update
    - [ ] Host plays music, both users see progress
- [ ] **Run:** `bunx playwright test` for full E2E suite

### Day 4-5: Polish & Performance
- [ ] **Error Handling:**
  - [ ] Add user-friendly error messages for all failure cases
  - [ ] Add retry logic for transient failures
  - [ ] Add error boundaries in React components
  - [ ] Log errors to Pino logger
- [ ] **Loading States:**
  - [ ] Add loading spinners to all async operations
  - [ ] Add skeleton loaders for queue list
  - [ ] Add optimistic updates for votes
  - [ ] Add progress indicators for search
- [ ] **Performance:**
  - [ ] Implement virtualization for large queue lists
  - [ ] Optimize database queries with proper indexes
  - [ ] Add Redis caching for frequently accessed data
  - [ ] Lazy load non-critical components
  - [ ] Optimize bundle size with code splitting
- [ ] **UX Polish:**
  - [ ] Add animations for queue reordering
  - [ ] Add haptic feedback for mobile votes
  - [ ] Add toast notifications for user actions
  - [ ] Add empty states for empty queues
  - [ ] Improve mobile responsiveness

**Deliverables:**
- ✅ 80%+ code coverage (backend)
- ✅ 70%+ code coverage (frontend)
- ✅ All critical user flows tested with E2E
- ✅ All error cases handled gracefully
- ✅ All loading states implemented
- ✅ Smooth animations and transitions

**Success Criteria:**
- `bun test --coverage` shows 80%+ backend, 70%+ frontend
- `bunx playwright test` passes all E2E tests
- No console errors in browser
- All async operations show loading state
- Error messages are user-friendly

**Testing Checklist (Review TESTING_GUIDE.md):**
- [ ] All critical algorithms have 100% coverage
- [ ] All API endpoints have integration tests
- [ ] All components have basic tests
- [ ] All critical user flows have E2E tests
- [ ] Tests run in CI on every PR
- [ ] Coverage reports uploaded to Codecov
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
