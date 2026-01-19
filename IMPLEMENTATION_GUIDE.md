# Snoppify - Critical Implementation Details

## Overview

This document details the critical algorithms, patterns, and implementation specifics that **must be preserved** in the rewrite to ensure Snoppify works correctly. These are the battle-tested solutions that make the app function properly.

---

## 1. Queue Reordering Algorithm

### Why It's Critical
The queue must maintain the currently playing track at position 0 while sorting all other tracks by vote count. This ensures seamless playback progression.

### Current Implementation
```javascript
rebuildQueueOrder() {
  const currentlyPlaying = this.states.data.playlist?.tracks?.items?.[0];
  
  this.queue.queue.sort((a, b) => {
    // Keep currently playing track at the top
    if (currentlyPlaying) {
      if (a.id === currentlyPlaying.track.id) return -1;
      if (b.id === currentlyPlaying.track.id) return 1;
    }
    
    // Sort remaining tracks by vote count (descending)
    return b.snoppify.votes.length - a.snoppify.votes.length;
  });
}
```

### Rewrite Implementation (PostgreSQL)
```sql
-- Query that maintains order correctly
WITH current_playing AS (
  SELECT track_id 
  FROM queue 
  WHERE party_id = $1 AND status = 'playing'
  LIMIT 1
)
SELECT 
  q.id,
  q.track_id,
  q.added_by_user_id,
  q.position,
  COUNT(v.id) as vote_count,
  t.*
FROM queue q
LEFT JOIN votes v ON v.queue_id = q.id
LEFT JOIN tracks t ON t.id = q.track_id
WHERE q.party_id = $1 AND q.status = 'pending'
GROUP BY q.id, t.id
ORDER BY 
  CASE 
    WHEN q.track_id = (SELECT track_id FROM current_playing) THEN 0
    ELSE 1
  END,
  COUNT(v.id) DESC,
  q.added_at ASC;
```

### Key Points
1. Currently playing track ALWAYS at position 0
2. Other tracks sorted by: vote count DESC, then added_at ASC
3. Reordering happens after every vote
4. Queue positions updated in database after reorder
5. Broadcast queue update via Socket.io after reorder

### Testing
- Add track when queue is empty → should be position 0
- Add second track → should be position 1
- Vote on second track → should reorder to position 1 (after current)
- Currently playing track should never move from position 0
- Tracks with equal votes sorted by add time (first added = higher priority)

---

## 2. Playback State Machine

### Why It's Critical
Automatic track progression and playback state management is complex. The state machine handles all edge cases (empty queue, backup playlist, pause/resume).

### State Diagram
```
       ┌─────────┐
       │ Paused  │◄──────────────────────────┐
       └────┬────┘                            │
            │                                 │
            │ user clicks play                │
            │ OR track queued                 │
            │ (and playlist empty)            │
            ▼                                 │
     ┌──────────────┐                        │
     │   Playing    │◄───────┐               │
     └──────┬───────┘        │               │
            │                 │               │
            │ track ending    │ track changed │
            │ detected        │ detected      │
            │                 │               │
            ▼                 │               │
   ┌─────────────────────┐   │               │
   │ WaitingForNextSong  ├───┘               │
   └──────────┬──────────┘                   │
              │                               │
              │ next track available          │
              │                               │
              ▼                               │
        ┌──────────┐                         │
        │ PlaySong │─────────────────────────┘
        └──────────┘                      user pauses
```

### State Definitions

**Paused:**
- Playback is stopped
- Can transition to Playing (user resumes) or PlaySong (track queued on empty playlist)

**Playing:**
- Track is currently playing
- Polls Spotify every 2 seconds for progress
- Transitions to WaitingForNextSong when track nearly finished (within 10 seconds)

**WaitingForNextSong:**
- Track ending soon, preparing next track
- Checks if next track in queue or backup playlist
- Transitions to PlaySong when track changes

**PlaySong:**
- Plays the next track from queue or backup playlist
- Updates current track
- Removes played track from queue
- Transitions to Playing or Paused based on playback state

### Transitions

```typescript
const transitions = [
  // From Paused
  {
    source: 'paused',
    target: 'playSong',
    condition: (d) => d.events.changedTrack
  },
  {
    source: 'paused',
    target: 'playing',
    condition: (d) => d.isPlaying && !d.events.changedTrack
  },
  {
    source: 'paused',
    target: 'waitingForNextSong',
    condition: (d) => d.events.queuedTrack && d.playlist?.tracks?.items?.length === 0
  },
  
  // From Playing
  {
    source: 'playing',
    target: 'paused',
    condition: (d) => !d.isPlaying && !d.events.changedTrack
  },
  {
    source: 'playing',
    target: 'waitingForNextSong',
    condition: (d) => {
      const { player } = d;
      if (!player || !player.item) return false;
      const remaining = player.item.duration_ms - player.progress_ms;
      return remaining < 10000; // Less than 10 seconds remaining
    }
  },
  {
    source: 'playing',
    target: 'playSong',
    condition: (d) => d.events.changedTrack
  },
  
  // From WaitingForNextSong
  {
    source: 'waitingForNextSong',
    target: 'playSong',
    condition: (d) => d.events.changedTrack
  },
  {
    source: 'waitingForNextSong',
    target: 'paused',
    condition: (d) => !d.isPlaying
  }
];
```

### Rewrite Implementation

```typescript
class PlaybackStateMachine {
  private currentState: PlaybackState = 'paused';
  private data: PlaybackData;
  
  constructor(private partyId: string) {}
  
  async update() {
    const transitions = this.getAvailableTransitions();
    
    for (const transition of transitions) {
      if (await transition.condition(this.data)) {
        await this.transition(transition.target);
        await this.onStateChange(transition.target);
        break;
      }
    }
  }
  
  private async transition(newState: PlaybackState) {
    console.log(`State transition: ${this.currentState} → ${newState}`);
    this.currentState = newState;
    
    switch (newState) {
      case 'playSong':
        await this.handlePlaySong();
        break;
      case 'playing':
        await this.handlePlaying();
        break;
      case 'paused':
        await this.handlePaused();
        break;
      case 'waitingForNextSong':
        await this.handleWaitingForNextSong();
        break;
    }
  }
  
  private async handlePlaySong() {
    // Get next track from queue
    const nextTrack = await this.getNextTrack();
    
    if (nextTrack) {
      // Play the track
      await this.spotifyService.play(this.partyId, nextTrack.spotifyUri);
      
      // Mark as playing in database
      await db.update(queue)
        .set({ status: 'playing', played_at: new Date() })
        .where(eq(queue.id, nextTrack.id));
      
      // Broadcast update
      io.to(`party:${this.partyId}`).emit('playback:updated', {
        currentTrack: nextTrack,
        isPlaying: true
      });
      
      // Reset event flags
      this.data.events.changedTrack = false;
    } else {
      // No tracks, try backup playlist
      const backupTrack = await this.getBackupTrack();
      
      if (backupTrack) {
        await this.spotifyService.play(this.partyId, backupTrack.uri);
      } else {
        // Nothing to play, go to paused
        this.currentState = 'paused';
      }
    }
  }
  
  private async getNextTrack() {
    const tracks = await db
      .select()
      .from(queue)
      .where(
        and(
          eq(queue.party_id, this.partyId),
          eq(queue.status, 'pending')
        )
      )
      .orderBy(
        // Keep currently playing at top, then by votes
        sql`CASE WHEN status = 'playing' THEN 0 ELSE 1 END`,
        desc(queue.vote_count),
        asc(queue.added_at)
      )
      .limit(1);
    
    return tracks[0] || null;
  }
}
```

### Key Points
1. State machine runs on interval (every 2 seconds)
2. Track ending detected at 10 seconds remaining
3. Empty queue falls back to backup playlist
4. All state changes broadcast via Socket.io
5. Database updated synchronously with state changes
6. Event flags reset after processing

---

## 3. Spotify Playlist Synchronization

### Why It's Critical
The Spotify playlist must stay in sync with the queue. If they diverge, playback breaks or wrong tracks play.

### Synchronization Strategy

**1. Add Track Flow:**
```typescript
async addTrackToQueue(partyId: string, trackId: string, userId: string) {
  // Start transaction
  await db.transaction(async (tx) => {
    // 1. Add to database queue
    const queueItem = await tx.insert(queue).values({
      party_id: partyId,
      track_id: trackId,
      added_by_user_id: userId,
      vote_count: 0,
      position: await getNextPosition(partyId),
      status: 'pending'
    }).returning();
    
    // 2. Get party playlist ID
    const party = await tx.select().from(parties).where(eq(parties.id, partyId)).limit(1);
    
    // 3. Add to Spotify playlist
    await spotifyService.addTracksToPlaylist(
      party[0].main_playlist_id,
      [`spotify:track:${trackId}`]
    );
    
    // 4. Reorder queue by votes
    await reorderQueue(partyId);
    
    // 5. Sync playlist order with queue order
    await syncPlaylistOrder(partyId);
  });
  
  // 6. Broadcast update
  const updatedQueue = await getQueue(partyId);
  io.to(`party:${partyId}`).emit('queue:updated', updatedQueue);
}
```

**2. Remove Track Flow:**
```typescript
async removeTrackFromQueue(partyId: string, trackId: string) {
  await db.transaction(async (tx) => {
    // 1. Find track in queue
    const queueItem = await tx
      .select()
      .from(queue)
      .where(
        and(
          eq(queue.party_id, partyId),
          eq(queue.track_id, trackId),
          eq(queue.status, 'pending')
        )
      )
      .limit(1);
    
    if (!queueItem[0]) throw new Error('Track not found');
    
    // 2. Remove from database
    await tx.delete(queue).where(eq(queue.id, queueItem[0].id));
    
    // 3. Get party playlist
    const party = await tx.select().from(parties).where(eq(parties.id, partyId)).limit(1);
    
    // 4. Remove from Spotify playlist
    await spotifyService.removeTracksFromPlaylist(
      party[0].main_playlist_id,
      [`spotify:track:${trackId}`]
    );
    
    // 5. Sync playlist order
    await syncPlaylistOrder(partyId);
  });
  
  // 6. Broadcast update
  const updatedQueue = await getQueue(partyId);
  io.to(`party:${partyId}`).emit('queue:updated', updatedQueue);
}
```

**3. Sync Playlist Order:**
```typescript
async syncPlaylistOrder(partyId: string) {
  // Get queue order from database
  const queueTracks = await db
    .select()
    .from(queue)
    .where(
      and(
        eq(queue.party_id, partyId),
        inArray(queue.status, ['pending', 'playing'])
      )
    )
    .orderBy(
      sql`CASE WHEN status = 'playing' THEN 0 ELSE 1 END`,
      desc(queue.vote_count),
      asc(queue.added_at)
    );
  
  // Build ordered URI list
  const orderedUris = queueTracks.map(t => `spotify:track:${t.track_id}`);
  
  // Get party playlist
  const party = await db
    .select()
    .from(parties)
    .where(eq(parties.id, partyId))
    .limit(1);
  
  // Replace playlist tracks (maintains order)
  await spotifyService.replacePlaylistTracks(
    party[0].main_playlist_id,
    orderedUris
  );
}
```

**4. Background Sync Job:**
```typescript
// Runs every 5 seconds for each active party
async function syncPlaylistWithQueue(partyId: string) {
  try {
    // Get current queue state from DB
    const queueTracks = await getQueueTracks(partyId);
    
    // Get current Spotify playlist state
    const party = await getParty(partyId);
    const playlistTracks = await spotifyService.getPlaylistTracks(
      party.main_playlist_id
    );
    
    // Compare
    const diff = calculateDiff(queueTracks, playlistTracks);
    
    if (diff.needsSync) {
      console.log(`Syncing playlist for party ${partyId}`);
      await syncPlaylistOrder(partyId);
    }
  } catch (error) {
    console.error(`Playlist sync error for party ${partyId}:`, error);
    // Don't throw - let next sync attempt retry
  }
}

function calculateDiff(queueTracks, playlistTracks) {
  const queueUris = queueTracks.map(t => `spotify:track:${t.track_id}`);
  const playlistUris = playlistTracks.map(t => t.track.uri);
  
  // Check if order or content differs
  const needsSync = 
    queueUris.length !== playlistUris.length ||
    queueUris.some((uri, index) => uri !== playlistUris[index]);
  
  return { needsSync };
}
```

### Key Points
1. Database is source of truth for queue order
2. Spotify playlist is synchronized to match database
3. All operations wrapped in transactions
4. Background job detects and fixes drift
5. Optimistic updates in UI, confirmed by server broadcast
6. Currently playing track always at playlist position 0

---

## 4. Vote System & Queue Reordering

### Why It's Critical
The voting system must prevent duplicate votes, allow toggling, and trigger queue reordering efficiently.

### Vote/Unvote Logic

```typescript
async toggleVote(partyId: string, trackId: string, userId: string) {
  await db.transaction(async (tx) => {
    // 1. Find queue item
    const queueItem = await tx
      .select()
      .from(queue)
      .where(
        and(
          eq(queue.party_id, partyId),
          eq(queue.track_id, trackId),
          eq(queue.status, 'pending')
        )
      )
      .limit(1);
    
    if (!queueItem[0]) throw new Error('Track not in queue');
    
    // 2. Check if user already voted
    const existingVote = await tx
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.queue_id, queueItem[0].id),
          eq(votes.user_id, userId)
        )
      )
      .limit(1);
    
    let action: 'voted' | 'unvoted';
    
    if (existingVote[0]) {
      // Unvote
      await tx.delete(votes).where(eq(votes.id, existingVote[0].id));
      action = 'unvoted';
    } else {
      // Vote
      await tx.insert(votes).values({
        queue_id: queueItem[0].id,
        user_id: userId
      });
      action = 'voted';
    }
    
    // 3. Update vote count (using database trigger or manually)
    const newVoteCount = await tx
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.queue_id, queueItem[0].id));
    
    await tx
      .update(queue)
      .set({ vote_count: newVoteCount[0].count })
      .where(eq(queue.id, queueItem[0].id));
    
    // 4. Reorder queue and sync playlist
    await reorderQueue(partyId, tx);
    await syncPlaylistOrder(partyId);
    
    return { action, voteCount: newVoteCount[0].count };
  });
  
  // 5. Broadcast update
  const updatedQueue = await getQueue(partyId);
  io.to(`party:${partyId}`).emit('queue:updated', updatedQueue);
  
  io.to(`party:${partyId}`).emit('vote:changed', {
    trackId,
    voteCount: result.voteCount
  });
}
```

### Database Trigger for Vote Count (Alternative)

```sql
-- Automatically update vote_count when votes change
CREATE OR REPLACE FUNCTION update_queue_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE queue
  SET vote_count = (
    SELECT COUNT(*)
    FROM votes
    WHERE queue_id = COALESCE(NEW.queue_id, OLD.queue_id)
  )
  WHERE id = COALESCE(NEW.queue_id, OLD.queue_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vote_count_on_vote
AFTER INSERT OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_queue_vote_count();
```

### Reorder Queue Function

```typescript
async function reorderQueue(partyId: string, tx?: Transaction) {
  const db_ = tx || db;
  
  // Get queue in correct order
  const orderedQueue = await db_
    .select()
    .from(queue)
    .where(
      and(
        eq(queue.party_id, partyId),
        inArray(queue.status, ['pending', 'playing'])
      )
    )
    .orderBy(
      sql`CASE WHEN status = 'playing' THEN 0 ELSE 1 END`,
      desc(queue.vote_count),
      asc(queue.added_at)
    );
  
  // Update positions
  for (let i = 0; i < orderedQueue.length; i++) {
    await db_.update(queue)
      .set({ position: i })
      .where(eq(queue.id, orderedQueue[i].id));
  }
}
```

### Key Points
1. Vote/unvote is a toggle operation
2. Users cannot vote on their own tracks (enforced in API)
3. Vote count updated immediately in database
4. Queue reordered after every vote change
5. Playlist synced after reorder
6. Real-time broadcast to all clients
7. Database trigger can automate vote count updates

---

## 5. User Queue Limits & Validation

### Why It's Critical
Prevents users from spamming the queue and keeps the experience fair.

### Validation Logic

```typescript
async validateQueueAdd(
  partyId: string,
  trackId: string,
  userId: string
): Promise<{ valid: boolean; error?: string }> {
  // 1. Check if track already in queue
  const existingTrack = await db
    .select()
    .from(queue)
    .where(
      and(
        eq(queue.party_id, partyId),
        eq(queue.track_id, trackId),
        inArray(queue.status, ['pending', 'playing'])
      )
    )
    .limit(1);
  
  if (existingTrack[0]) {
    return { valid: false, error: 'Track already in queue' };
  }
  
  // 2. Get party settings
  const party = await db
    .select()
    .from(parties)
    .where(eq(parties.id, partyId))
    .limit(1);
  
  const maxTracksPerUser = party[0].max_tracks_per_user || 5;
  
  // 3. Count user's current tracks in queue
  const userTrackCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(queue)
    .where(
      and(
        eq(queue.party_id, partyId),
        eq(queue.added_by_user_id, userId),
        eq(queue.status, 'pending')
      )
    );
  
  if (userTrackCount[0].count >= maxTracksPerUser) {
    return {
      valid: false,
      error: `You cannot add more than ${maxTracksPerUser} tracks`
    };
  }
  
  // 4. Validate track exists on Spotify
  try {
    await spotifyService.getTrack(trackId);
  } catch (error) {
    return { valid: false, error: 'Track not found on Spotify' };
  }
  
  return { valid: true };
}
```

### Add Track with Validation

```typescript
async addTrackToQueue(partyId: string, trackId: string, userId: string) {
  // Validate
  const validation = await validateQueueAdd(partyId, trackId, userId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Get full track data from Spotify
  const trackData = await spotifyService.getTrack(trackId);
  
  await db.transaction(async (tx) => {
    // 1. Ensure track exists in tracks table
    await tx
      .insert(tracks)
      .values({
        id: trackId,
        name: trackData.name,
        artists: trackData.artists,
        album: trackData.album,
        duration_ms: trackData.duration_ms,
        spotify_uri: trackData.uri,
        preview_url: trackData.preview_url
      })
      .onConflictDoNothing();
    
    // 2. Add to queue
    const nextPosition = await getNextPosition(partyId, tx);
    
    await tx.insert(queue).values({
      party_id: partyId,
      track_id: trackId,
      added_by_user_id: userId,
      vote_count: 0,
      position: nextPosition,
      status: 'pending',
      added_at: new Date()
    });
    
    // 3. Add to Spotify playlist
    const party = await tx
      .select()
      .from(parties)
      .where(eq(parties.id, partyId))
      .limit(1);
    
    await spotifyService.addTracksToPlaylist(
      party[0].main_playlist_id,
      [trackData.uri]
    );
    
    // 4. Trigger state machine check (if queue was empty)
    const queueSize = await tx
      .select({ count: sql<number>`count(*)` })
      .from(queue)
      .where(
        and(
          eq(queue.party_id, partyId),
          eq(queue.status, 'pending')
        )
      );
    
    if (queueSize[0].count === 1) {
      // Queue was empty, new track added - trigger state machine
      await stateMachine.setEvent(partyId, 'queuedTrack');
    }
  });
  
  // Broadcast update
  const updatedQueue = await getQueue(partyId);
  io.to(`party:${partyId}`).emit('queue:updated', updatedQueue);
  
  return { success: true };
}
```

### Key Points
1. Check duplicate tracks globally (not just per-user)
2. Enforce per-user track limits from party settings
3. Validate track exists on Spotify before adding
4. Track metadata cached in database
5. State machine notified when first track added to empty queue
6. All operations atomic (transaction)

---

## 6. Token Refresh Automation

### Why It's Critical
Spotify access tokens expire after 1 hour. Without automatic refresh, API calls fail and playback breaks.

### Token Refresh Service

```typescript
class TokenRefreshService {
  private refreshInterval: NodeJS.Timeout;
  
  start() {
    // Check every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.refreshExpiringSoonTokens();
    }, 5 * 60 * 1000);
  }
  
  stop() {
    clearInterval(this.refreshInterval);
  }
  
  async refreshExpiringSoonTokens() {
    // Find tokens expiring in next 10 minutes
    const expiringUsers = await db
      .select()
      .from(users)
      .where(
        and(
          isNotNull(users.spotify_refresh_token),
          or(
            isNull(users.spotify_token_expires_at),
            sql`${users.spotify_token_expires_at} < NOW() + INTERVAL '10 minutes'`
          )
        )
      );
    
    console.log(`Refreshing tokens for ${expiringUsers.length} users`);
    
    for (const user of expiringUsers) {
      try {
        await this.refreshUserToken(user.id);
      } catch (error) {
        console.error(`Failed to refresh token for user ${user.id}:`, error);
      }
    }
  }
  
  async refreshUserToken(userId: string) {
    // Get current refresh token
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user[0] || !user[0].spotify_refresh_token) {
      throw new Error('No refresh token available');
    }
    
    // Request new access token
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user[0].spotify_refresh_token
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${data.error}`);
    }
    
    // Update in database
    await db
      .update(users)
      .set({
        spotify_access_token: data.access_token,
        spotify_refresh_token: data.refresh_token || user[0].spotify_refresh_token,
        spotify_token_expires_at: new Date(Date.now() + data.expires_in * 1000),
        updated_at: new Date()
      })
      .where(eq(users.id, userId));
    
    console.log(`Token refreshed for user ${userId}`);
    
    return data.access_token;
  }
}

// Start service
const tokenRefreshService = new TokenRefreshService();
tokenRefreshService.start();
```

### Automatic Refresh on API Call

```typescript
class SpotifyAPIClient {
  async makeRequest(userId: string, endpoint: string, options: any) {
    try {
      // Get user's access token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user[0]) throw new Error('User not found');
      
      // Check if token expired
      if (user[0].spotify_token_expires_at < new Date()) {
        // Refresh before making request
        await tokenRefreshService.refreshUserToken(userId);
        
        // Reload user with new token
        const refreshedUser = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        user[0] = refreshedUser[0];
      }
      
      // Make request
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${user[0].spotify_access_token}`
        }
      });
      
      // Handle 401 - token invalid despite check
      if (response.status === 401) {
        // Refresh and retry once
        await tokenRefreshService.refreshUserToken(userId);
        
        const refreshedUser = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        return await fetch(`https://api.spotify.com/v1${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${refreshedUser[0].spotify_access_token}`
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Spotify API request failed:', error);
      throw error;
    }
  }
}
```

### Key Points
1. Background job refreshes tokens every 5 minutes
2. Refresh tokens expiring within 10 minutes proactively
3. Automatic retry with refresh on 401 errors
4. Store token expiry time in database
5. Refresh token may rotate - save new refresh token
6. Handle refresh failures gracefully (log, don't crash)

---

## 7. Real-Time Event Broadcasting

### Why It's Critical
All clients must stay synchronized. Events must be broadcast efficiently to avoid race conditions.

### Socket.io Room Structure

```typescript
// Party rooms
io.to(`party:${partyId}`).emit('event', data);

// User-specific messages
io.to(`user:${userId}`).emit('event', data);
```

### Event Types and Payloads

**queue:updated**
```typescript
interface QueueUpdatedEvent {
  partyId: string;
  queue: QueueItem[];
  addedTracks?: Track[];
  removedTracks?: Track[];
}
```

**playback:updated**
```typescript
interface PlaybackUpdatedEvent {
  partyId: string;
  isPlaying: boolean;
  currentTrack: Track | null;
  progress: number; // milliseconds
  duration: number; // milliseconds
}
```

**vote:changed**
```typescript
interface VoteChangedEvent {
  partyId: string;
  trackId: string;
  voteCount: number;
  userId: string; // who voted
  action: 'voted' | 'unvoted';
}
```

**user:joined**
```typescript
interface UserJoinedEvent {
  partyId: string;
  user: {
    id: string;
    displayName: string;
    profilePicture: string;
  };
}
```

### Broadcasting Best Practices

```typescript
// 1. Broadcast after database commit (not before)
await db.transaction(async (tx) => {
  // ... database operations
});
// Transaction committed, now broadcast
io.to(`party:${partyId}`).emit('queue:updated', data);

// 2. Include only necessary data in events
// Bad: send entire queue object
io.emit('update', fullQueueObject);

// Good: send minimal update info
io.emit('vote:changed', { trackId, voteCount });

// 3. Use rooms for targeted broadcasting
// Don't send party A updates to party B users
io.to(`party:${partyIdA}`).emit('queue:updated', dataA);
io.to(`party:${partyIdB}`).emit('queue:updated', dataB);

// 4. Debounce rapid updates
// E.g., playback progress every 2 seconds, not every 100ms
let lastProgressBroadcast = 0;
const PROGRESS_INTERVAL = 2000;

function maybebroadcastProgress(partyId: string, progress: number) {
  const now = Date.now();
  if (now - lastProgressBroadcast >= PROGRESS_INTERVAL) {
    io.to(`party:${partyId}`).emit('playback:updated', { progress });
    lastProgressBroadcast = now;
  }
}
```

### Connection Management

```typescript
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Verify authentication
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  
  if (!user) {
    socket.disconnect();
    return;
  }
  
  // Store user info on socket
  socket.data.userId = user.id;
  
  // Join personal room
  socket.join(`user:${user.id}`);
  
  // Handle join party
  socket.on('join:party', async (partyId: string) => {
    // Verify access
    const hasAccess = await verifyPartyAccess(user.id, partyId);
    if (!hasAccess) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }
    
    // Join party room
    socket.join(`party:${partyId}`);
    socket.data.partyId = partyId;
    
    // Notify others
    socket.to(`party:${partyId}`).emit('user:joined', {
      user: {
        id: user.id,
        displayName: user.display_name,
        profilePicture: user.profile_picture_url
      }
    });
    
    // Send current state to new joiner
    const queue = await getQueue(partyId);
    const playback = await getPlaybackState(partyId);
    
    socket.emit('queue:updated', { queue });
    socket.emit('playback:updated', playback);
  });
  
  // Handle leave party
  socket.on('leave:party', (partyId: string) => {
    socket.leave(`party:${partyId}`);
    socket.to(`party:${partyId}`).emit('user:left', { userId: user.id });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    if (socket.data.partyId) {
      socket.to(`party:${socket.data.partyId}`).emit('user:left', {
        userId: user.id
      });
    }
  });
});
```

### Key Points
1. Use rooms for party-based broadcasting
2. Verify authentication on socket connection
3. Send current state to newly joined users
4. Broadcast changes after database commits
5. Include minimal data in events
6. Debounce rapid updates (playback progress)
7. Handle disconnections gracefully

---

## 8. Error Handling & Edge Cases

### Critical Edge Cases

**1. Empty Queue Handling:**
```typescript
async function getNextTrack(partyId: string): Promise<Track | null> {
  // Try queue first
  const queueTrack = await getNextQueueTrack(partyId);
  if (queueTrack) return queueTrack;
  
  // Fallback to backup playlist
  const party = await getParty(partyId);
  if (party.backup_playlist_uri) {
    const backupTrack = await getRandomBackupTrack(party.backup_playlist_uri);
    if (backupTrack) return backupTrack;
  }
  
  // Nothing to play
  return null;
}
```

**2. Currently Playing Track Removed:**
```typescript
async function removeTrackFromQueue(partyId: string, trackId: string) {
  const track = await getQueueTrack(partyId, trackId);
  
  if (track.status === 'playing') {
    // Cannot remove currently playing track
    throw new Error('Cannot remove currently playing track');
  }
  
  // ... proceed with removal
}
```

**3. Device Disconnected:**
```typescript
async function play(partyId: string) {
  try {
    await spotifyAPI.play();
  } catch (error) {
    if (error.statusCode === 404) {
      // No active device
      throw new Error('No active device. Please select a device.');
    }
    throw error;
  }
}
```

**4. Token Refresh Failure:**
```typescript
async function handleTokenRefreshFailure(userId: string) {
  // Mark token as invalid
  await db.update(users)
    .set({
      spotify_access_token: null,
      spotify_token_expires_at: null
    })
    .where(eq(users.id, userId));
  
  // Notify user to re-authenticate
  io.to(`user:${userId}`).emit('auth:expired', {
    message: 'Your Spotify session has expired. Please log in again.'
  });
}
```

**5. Simultaneous Votes (Race Condition):**
```typescript
// Use database transaction + unique constraint
async function vote(queueId: string, userId: string) {
  try {
    await db.insert(votes).values({
      queue_id: queueId,
      user_id: userId
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      // Already voted - treat as unvote
      await db.delete(votes)
        .where(
          and(
            eq(votes.queue_id, queueId),
            eq(votes.user_id, userId)
          )
        );
    } else {
      throw error;
    }
  }
}
```

---

## Summary

These implementation details are the result of real-world usage and debugging. They represent solutions to edge cases that aren't obvious until the app is used in production. **Any rewrite must preserve these patterns** or risk breaking critical functionality.

Key takeaways:
1. **Queue ordering** is complex - maintain currently playing track at position 0
2. **State machine** handles playback transitions automatically
3. **Playlist sync** must be bidirectional and resilient
4. **Voting** requires careful race condition handling
5. **Token refresh** must be automatic and robust
6. **Real-time events** must be broadcast after database commits
7. **Edge cases** (empty queue, disconnected devices, expired tokens) must be handled gracefully

These patterns should be translated to the new tech stack (React + Bun + PostgreSQL) while maintaining the same logical flow and error handling.
