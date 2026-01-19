# Snoppify - Feature Analysis

## Executive Summary

Snoppify is a democratic party music queue application that integrates with Spotify. It allows multiple users to add songs to a shared queue, upvote tracks, and ensures fair play by limiting how many songs each person can queue. The host controls playback while guests can search, queue, and vote on songs.

---

## Core Features

### 1. User Authentication & Quick Auth System

**Description:**
Multi-provider authentication system designed for quick party access without complex setup.

**Implementation Details:**
- **Multiple OAuth Providers:**
  - Spotify OAuth (primary - required for hosts)
  - Facebook OAuth (guest access)
  - Google OAuth (guest access)
- **Passport.js Integration:**
  - Session-based authentication using `express-session`
  - Session storage using `connect-loki` (LokiStore)
  - Cookie-based session management
  - Fingerprint.js for device identification
- **User Management:**
  - File-based user storage in `/data` directory
  - User model tracks: username, display name, profile picture, tokens, host status, parties, and queued tracks
  - Automatic user creation on first login
  - Token refresh mechanism for Spotify access

**Key Files:**
- `server/auth/passport.ts` - OAuth strategies configuration
- `server/models/user.ts` - User data model and storage
- `src/components/Welcome.vue` - Guest login page
- `src/components/NewUser.vue` - New user onboarding

**Why It's Critical:**
Quick, frictionless authentication is essential for party environments where users need to join instantly without creating accounts or remembering passwords.

---

### 2. In-App Search & Queue Management

**Description:**
Real-time Spotify track search and queue management system with smart track lookup.

**Implementation Details:**
- **Search Functionality:**
  - Full-text search using Spotify Web API (`searchTracks`)
  - Smart ID extraction from Spotify URLs and URIs
  - Supports both search terms and direct Spotify links/URIs
  - Search patterns: `spotify:track:ID` and `open.spotify.com/track/ID`
  - Results show if tracks are already in queue
- **Queue System:**
  - Custom `Queue.js` class with array-based storage
  - Queue persistence to JSON files in `/data` directory
  - Per-user queue tracking (max 5 tracks per user configurable via `maxQueueSize`)
  - Tracks include metadata: issuer, votes, timestamp
  - Automatic queue reordering based on votes
  - Socket.io real-time queue updates to all clients
- **Track Management:**
  - Add tracks to queue with validation (duplicate check, user limit check)
  - Remove own tracks from queue
  - View who added each track
  - Track history tracking

**Key Files:**
- `server/Queue.js` - Queue data structure
- `server/routes/index.ts` - Search and queue API endpoints
- `src/components/SearchDropdown.vue` - Search UI component
- `src/api/queue.js` - Client-side queue API
- `src/store/Queue.js` - Vuex queue state management

**Why It's Critical:**
The search and queue system is the core user interaction point. Users spend most of their time searching and adding tracks, so this must be fast, reliable, and intuitive.

---

### 3. Democratic Upvoting System

**Description:**
Fair voting system where users can upvote tracks they want to hear next, automatically reordering the queue.

**Implementation Details:**
- **Voting Mechanism:**
  - One vote per user per track
  - Users cannot vote on their own tracks
  - Toggle vote/unvote functionality
  - Vote count displayed on each track
  - Visual indication of user's voted tracks
- **Queue Reordering:**
  - `rebuildQueueOrder()` function sorts queue by vote count
  - Maintains currently playing track at top
  - Real-time reordering as votes come in
  - Preserves track issuer and metadata during reordering
- **Vote Persistence:**
  - Votes stored in track's `snoppify.votes` array
  - Persisted to disk with queue data
  - Restored on server restart
- **UI Features:**
  - Vote button shows current vote count
  - Active state for tracks user has voted for
  - Disabled state for own tracks
  - Animated transitions when tracks reorder

**Key Files:**
- `server/spotify/spotify-controller.ts` - Vote/unvote logic, queue reordering
- `src/components/TrackItem.vue` - Vote button UI
- `server/routes/index.ts` - Vote/unvote API endpoints

**Why It's Critical:**
The democratic voting system is what makes Snoppify fair and engaging. It prevents any one person from dominating the playlist and keeps everyone invested in the party's music selection.

---

### 4. Spotify Playlist & Playback Control

**Description:**
Complete Spotify integration for managing playlists and controlling playback across devices.

**Implementation Details:**

#### Playlist Management:
- **Main Playlist:**
  - Created automatically when hosting a party
  - Named `Snoppify {timestamp}`
  - Stores all queued tracks
  - Tracks added/removed dynamically via Spotify API
- **Backup Playlist:**
  - Optional fallback when queue is empty
  - Set by host via Spotify URI/URL
  - Extracted from URIs: `spotify:playlist:ID` or `open.spotify.com/playlist/ID`
  - Plays when no user-queued tracks available

#### Playback Control:
- **SpotifyController** (main orchestrator):
  - Manages queue and playback state
  - State machine for playback states (paused, playing, playSong, waitingForNextSong)
  - Automatic track progression
  - Poll-based playback monitoring (2-second intervals)
  - Handles track ending detection (within 10 seconds of end)
- **SpotifyPlaybackAPI** (device control):
  - List available Spotify devices
  - Set active device
  - Play/pause/skip controls
  - Volume control (if supported)
  - Transfer playback between devices
- **State Machine:**
  - Tracks: `paused`, `playing`, `playSong`, `waitingForNextSong`
  - Events: `queuedTrack`, `dequeuedTrack`, `changedTrack`, `startedPlaying`, `stoppedPlaying`, `userVoted`
  - Automatic transitions based on queue and playback state
  - Handles edge cases (empty queue, backup playlist fallback)

#### Token Management:
- OAuth refresh token stored per user
- Automatic token refresh on expiration
- Backend handles all Spotify API authentication
- Both user-specific and backend-only API clients

**Key Files:**
- `server/spotify/spotify-controller.ts` - Main playback orchestration
- `server/spotify/spotify-playback-api.ts` - Device and playback control
- `server/spotify/spotify-api.ts` - Spotify API client wrapper
- `server/spotify/spotify-states.ts` - State machine definition
- `server/spotify/index.ts` - Host management and initialization
- `src/components/Host.vue` - Host control panel UI

**Why It's Critical:**
Reliable playlist management and playback control is the foundation of the entire app. Without proper state management and error handling, the music stops and the party fails.

---

### 5. Party Hosting & Multi-Party Support

**Description:**
System for creating and managing multiple independent party instances with their own queues and settings.

**Implementation Details:**
- **Party Creation:**
  - Unique party ID generated (timestamp-based)
  - Party metadata: ID, name, host user, playlist IDs, creation time
  - Each party has isolated queue, users, and settings
  - Party data persisted to JSON files
- **Host Management:**
  - Only Spotify-authenticated users can host
  - Host has full control over playback
  - Host can switch between their parties
  - Host sets active Spotify device
  - Host configures backup playlist
- **Party Persistence:**
  - Queue state saved to `/data/snoppify-party-{partyId}.json`
  - Includes: queue, current track, playlists, settings
  - Automatic restoration on server restart
- **User-Party Association:**
  - Users store `partyId` to associate with current party
  - Multiple parties per host tracked in `user.parties` array
  - Party switching via `setParty` endpoint
- **SnoppifyHost Object:**
  - Per-party instance containing: SpotifyAPI client, PlaybackAPI, Controller
  - Stored in `activeHosts` dictionary by party/host ID
  - Each party operates independently

**Key Files:**
- `server/spotify/index.ts` - Host creation and management
- `server/routes/index.ts` - Party search and switching endpoints
- `src/components/Host.vue` - Host dashboard UI
- `server/models/user.ts` - User-party associations

**Why It's Critical:**
Multi-party support allows the same server instance to handle multiple simultaneous parties, making it scalable and suitable for hosting services.

---

### 6. Real-Time Communication (Socket.io)

**Description:**
WebSocket-based real-time updates for queue changes, playback state, and user events.

**Implementation Details:**
- **Socket.io Integration:**
  - Server-side socket singleton pattern
  - Shared session middleware between Express and Socket.io
  - Automatic reconnection handling
  - Client connects on app initialization
- **Real-Time Events:**
  - `queue` - Queue updates (added/removed tracks, reordering)
  - `event` - General events (new user joined, playback state changes)
  - `player` - Playback status updates (progress, playing/paused)
  - `search` - Live search results (commented out in current code)
  - `getTrack` - Individual track details with audio features
- **State Synchronization:**
  - Queue changes broadcast to all connected clients
  - Playback state updates every poll interval
  - User presence notifications
  - Vote changes trigger queue reorder notifications
- **Session Integration:**
  - Socket handshake includes Express session
  - User authentication verified on socket connection
  - Per-user socket tracking

**Key Files:**
- `server/socket.js` - Socket.io singleton setup
- `server/index.ts` - Socket event handlers
- `src/socket.js` - Client-side socket initialization
- `src/store/` - Vuex mutations for socket events

**Why It's Critical:**
Real-time updates create a collaborative, live experience. Users see queue changes instantly, creating a sense of shared participation essential for party atmosphere.

---

### 7. User Presence & Friend Tracking

**Description:**
System to show who's at the party and track active users.

**Implementation Details:**
- **User Tracking:**
  - Users stored in memory and persisted to disk
  - Each user has: ID, display name, profile picture, queue
  - "Friends" list shows all users who have queued tracks
  - New user join events broadcast to all clients
- **Friend Detection:**
  - Users who add tracks are added to friends list
  - Friend count displayed on Home page
  - Show friends modal with user profiles
- **Profile Display:**
  - User profile picture shown on each queued track
  - Display name shown as track issuer
  - Visual representation of party participants

**Key Files:**
- `server/models/user.ts` - User management
- `src/components/Home.vue` - Friends list UI
- `src/components/TrackItem.vue` - User profile on tracks

**Why It's Critical:**
Seeing who's at the party and who added which songs creates social accountability and makes the experience more personal and engaging.

---

### 8. QR Code Party Sharing

**Description:**
Easy party joining via QR codes for quick mobile access.

**Implementation Details:**
- **QR Code Generation:**
  - Uses `qrcode` npm package
  - Generates QR for party URL
  - Separate WiFi QR code for network sharing
  - Modal display with scannable codes
- **Share Features:**
  - Party URL includes server address and port
  - Direct link to party join page
  - Mobile-friendly join flow

**Key Files:**
- `src/components/Home.vue` - QR code generation and display

**Why It's Critical:**
QR codes eliminate the need to type URLs on mobile devices, reducing friction for guests joining the party.

---

### 9. Track Details & Audio Features

**Description:**
Detailed view of individual tracks including Spotify audio features.

**Implementation Details:**
- **Track Information:**
  - Album artwork
  - Artist(s) information
  - Album details
  - Release date
  - Track duration
- **Audio Features:**
  - Danceability, energy, key, loudness, mode
  - Speechiness, acousticness, instrumentalness
  - Liveness, valence, tempo
  - Fetched from Spotify's audio features API
- **Socket-Based Loading:**
  - Track details requested via socket
  - Combines track info and audio features in single response

**Key Files:**
- `src/components/Track.vue` - Track detail view
- `server/index.ts` - Track fetching with audio features

**Why It's Critical:**
Detailed track information helps users make informed decisions about what to queue and provides interesting context for music discovery.

---

### 10. Playback Progress & Status

**Description:**
Real-time display of current track progress and playback state.

**Implementation Details:**
- **Progress Tracking:**
  - Polling Spotify's player state every 2 seconds
  - Progress bar showing elapsed time vs total duration
  - Time formatted as MM:SS
  - Percentage-based progress bar width
- **Playback State:**
  - Playing/paused status
  - Current track display with album art
  - Next track in queue preview
  - Empty queue state handling
- **State Updates:**
  - Broadcast via Socket.io to all clients
  - Smooth UI updates without page refresh
  - State machine coordinates playback transitions

**Key Files:**
- `server/spotify/spotify-controller.ts` - Playback polling
- `src/components/Home.vue` - Progress display
- `src/store/Spotify.js` - Player state management

**Why It's Critical:**
Visible playback progress gives users confidence that the system is working and helps them know when their song will play.

---

## Technical Architecture

### Frontend (Vue 2)
- **Framework:** Vue 2 with Vuex for state management
- **Routing:** Vue Router with auth guards
- **Components:** Single-file Vue components with scoped SCSS
- **Real-time:** Socket.io client integration
- **Build:** Vue CLI with Webpack

### Backend (Node.js + TypeScript)
- **Framework:** Express.js
- **Language:** TypeScript with JavaScript legacy code
- **Authentication:** Passport.js with multiple OAuth strategies
- **Real-time:** Socket.io server
- **Data Storage:** File-based JSON storage (not database)
- **Session:** Express-session with Loki store

### Spotify Integration
- **Library:** spotify-web-api-node
- **APIs Used:**
  - Web API (search, tracks, playlists, audio features)
  - Playback API (device control, play/pause/skip)
- **Authentication:** OAuth 2.0 with refresh tokens

### Development Tools
- **Linting:** ESLint with Airbnb config + TypeScript support
- **Formatting:** Prettier
- **Testing:** Jest (with test files present but minimal coverage)
- **Git Hooks:** Husky with lint-staged
- **Package Manager:** npm

---

## Critical Implementation Details That Must Be Preserved

### 1. Queue Reordering Algorithm
```javascript
rebuildQueueOrder() {
  const currentlyPlaying = this.states.data.playlist?.tracks?.items?.[0];
  
  this.queue.queue.sort((a, b) => {
    // Keep currently playing track at top
    if (currentlyPlaying) {
      if (a.id === currentlyPlaying.track.id) return -1;
      if (b.id === currentlyPlaying.track.id) return 1;
    }
    
    // Sort by vote count (descending)
    return b.snoppify.votes.length - a.snoppify.votes.length;
  });
}
```
This ensures the currently playing track stays at position 0 while all other tracks are sorted by votes.

### 2. State Machine Logic
The state machine handles playback transitions automatically:
- Detects when a track is ending (within 10 seconds)
- Transitions from `playing` → `waitingForNextSong` → `playSong`
- Falls back to backup playlist when queue is empty
- Handles pause/resume correctly

### 3. Spotify Playlist Sync
- Tracks must be added to the Spotify playlist, not just queued in memory
- Use `addTracksToPlaylist` to add to playlist
- Use `removeTracksFromPlaylist` to remove
- Currently playing track must stay in playlist[0] position

### 4. Token Refresh Flow
- Refresh tokens stored securely per user
- Backend creates separate SpotifyAPI clients per party/host
- Client never has direct access to tokens
- Automatic refresh on 401 responses

### 5. Session & Socket Integration
- Express session shared with Socket.io via `express-socket.io-session`
- User authentication verified on both HTTP and WebSocket connections
- Session data accessible in socket handlers via `sock.handshake.session`

### 6. File-Based Persistence
- Queue saved to `/data/snoppify-party-{id}.json`
- Users saved to `/data/users.json`
- Atomic writes using `write-file-atomic`
- Automatic directory creation on startup

### 7. Per-User Queue Limits
- Each user has a personal queue tracked in `userData.queue`
- `maxQueueSize` (default 5) enforced per user
- Prevents queue spam and keeps it democratic

### 8. Duplicate Track Prevention
- Check both global queue and user's personal queue
- Prevent same track from being added twice globally
- Prevent user from adding same track twice

### 9. Vote Toggle Logic
- One vote per user per track
- Cannot vote on own tracks
- Toggle implementation allows unvoting
- Queue reorders automatically after vote changes

### 10. Device Selection & Playback Transfer
- Host selects active Spotify device
- Playback transferred to selected device when starting
- Graceful handling of device disconnection
- Device list refresh mechanism

---

## Known Issues & Technical Debt

### Security Issues
1. **Hardcoded Session Secret:** `"spotify är sh1t, snoppify är bra!"` should be environment variable
2. **CORS Configuration:** Currently allows all origins based on request header
3. **No Rate Limiting:** API endpoints vulnerable to abuse
4. **File Storage:** No encryption for user data or tokens

### Scalability Issues
1. **File-Based Storage:** Won't scale beyond single server
2. **In-Memory State:** Lost on server restart for active sessions
3. **No Load Balancing:** Socket.io requires sticky sessions
4. **Polling-Based Sync:** 2-second poll creates unnecessary API calls

### Code Quality Issues
1. **Mixed JS/TS:** Inconsistent use of TypeScript
2. **Commented Code:** Large blocks of dead code
3. **Error Handling:** Many generic catch blocks
4. **Type Safety:** Many `any` types and type assertions
5. **Test Coverage:** Minimal tests despite test infrastructure

### UX Issues
1. **No Error Messages:** Many failures silent to users
2. **No Loading States:** Users don't know when actions are processing
3. **No Offline Handling:** App breaks without internet
4. **Mobile Experience:** Not optimized for mobile screens

### Dependency Issues
1. **Outdated Packages:** Vue 2 (EOL), old dependencies
2. **Security Vulnerabilities:** Likely present in old packages
3. **Deprecated APIs:** Some Spotify API calls may be outdated

---

## Features Working Well

1. **Quick OAuth Login:** Users can join parties in seconds
2. **Real-Time Updates:** Queue changes appear instantly for all users
3. **Vote System:** Democratic voting works smoothly
4. **Multi-Party Support:** Multiple simultaneous parties work correctly
5. **Playlist Management:** Spotify integration is reliable
6. **State Persistence:** Parties survive server restarts
7. **Smart Search:** Both text search and Spotify links work

---

## Summary

Snoppify is a well-thought-out democratic party music queue app with solid core features. The key innovations are:

1. **Democratic voting system** that keeps playlists fair
2. **Quick authentication** optimized for party environments
3. **Multi-party support** allowing one server to host many parties
4. **Real-time synchronization** creating collaborative experience
5. **Smart queue management** with per-user limits and duplicate prevention

The main challenges for a rewrite are:
- Modernizing the tech stack while preserving functionality
- Moving from file-based to database storage
- Improving error handling and user feedback
- Adding proper security measures
- Maintaining the state machine logic correctly
- Ensuring real-time sync remains reliable

The app's strength is in its simple, focused feature set that solves a real problem. The rewrite should preserve this simplicity while adding polish, security, and scalability.
