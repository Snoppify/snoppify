# Testing Guide for Snoppify Rewrite

> Comprehensive guide to testing practices, patterns, and workflows using Bun's built-in test runner

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [Project Testing Structure](#project-testing-structure)
- [Writing Tests](#writing-tests)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [E2E Tests](#e2e-tests)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Testing Best Practices](#testing-best-practices)
- [When to Write Tests](#when-to-write-tests)
- [Mocking & Fixtures](#mocking--fixtures)
- [Testing Database Code](#testing-database-code)
- [Testing Real-Time Features](#testing-real-time-features)
- [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

**Test with confidence, ship with speed.**

### Core Principles

1. **Test behavior, not implementation** - Focus on what your code does, not how it does it
2. **Write tests as you code** - Don't wait until the end; test incrementally
3. **Keep tests fast** - Fast tests = frequent runs = early bug detection
4. **Test the critical path first** - Queue ordering, voting, playback state machine
5. **Use the right test type** - Unit for logic, integration for APIs, E2E for user flows
6. **Make tests readable** - Tests are documentation; write them clearly

### Coverage Goals

- **Overall:** 80%+ code coverage
- **Critical algorithms:** 100% coverage (queue ordering, vote system, state machine)
- **API endpoints:** 90%+ coverage
- **UI components:** 70%+ coverage (focus on logic, not styles)
- **E2E flows:** All critical user paths tested

---

## Testing Stack

### Bun Test (Primary Test Runner)

**Why Bun Test?**
- ✅ **Built-in:** No installation needed, comes with Bun
- ✅ **Fast:** 10x faster than Jest for many test suites
- ✅ **Jest-compatible API:** Familiar syntax (`describe`, `it`, `expect`)
- ✅ **TypeScript/JSX native:** No configuration needed
- ✅ **Mocking built-in:** `mock()`, `spyOn()` included
- ✅ **Snapshot testing:** Full support for snapshot tests
- ✅ **Watch mode:** `bun test --watch` for TDD
- ✅ **Coverage:** `bun test --coverage` built-in

### Playwright (E2E Tests)

- Browser automation for end-to-end testing
- Tests real user interactions across multiple browsers
- API for network interception, screenshots, videos

### Happy-DOM (DOM Testing)

- Lightweight DOM implementation for component tests
- Built into Bun test for React component testing
- Faster than JSDOM

---

## Project Testing Structure

```
snoppify/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── parties.ts
│   │   │   └── parties.test.ts        # ✅ Co-located tests
│   │   ├── services/
│   │   │   ├── spotify.ts
│   │   │   └── spotify.test.ts
│   │   ├── db/
│   │   │   ├── queries.ts
│   │   │   └── queries.test.ts
│   │   └── utils/
│   │       ├── queue.ts
│   │       └── queue.test.ts          # ✅ Test critical logic
│   ├── tests/
│   │   ├── integration/               # Integration tests
│   │   │   ├── api.test.ts
│   │   │   └── auth.test.ts
│   │   ├── fixtures/                  # Test data
│   │   │   ├── parties.json
│   │   │   └── tracks.json
│   │   └── helpers/                   # Test utilities
│   │       ├── setup.ts
│   │       └── factories.ts
│   └── package.json
│
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx        # ✅ Co-located tests
│   │   ├── hooks/
│   │   │   ├── useQueue.ts
│   │   │   └── useQueue.test.ts
│   │   └── utils/
│   │       ├── time.ts
│   │       └── time.test.ts
│   ├── tests/
│   │   ├── e2e/                       # E2E with Playwright
│   │   │   ├── auth.spec.ts
│   │   │   ├── party.spec.ts
│   │   │   └── queue.spec.ts
│   │   └── setup/
│   │       └── test-utils.tsx         # Render helpers
│   └── package.json
│
└── package.json                        # Root test commands
```

**Key Patterns:**
- ✅ Tests live next to the code they test (`*.test.ts`)
- ✅ Integration tests in dedicated `tests/integration/`
- ✅ E2E tests in `tests/e2e/`
- ✅ Shared test utilities in `tests/helpers/` or `tests/setup/`

---

## Writing Tests

### Unit Tests

**Purpose:** Test individual functions, utilities, and business logic in isolation.

#### Backend Unit Test Example

```typescript
// server/src/utils/queue.test.ts
import { describe, it, expect } from 'bun:test'
import { reorderQueue, type QueueItem } from './queue'

describe('reorderQueue', () => {
  it('keeps currently playing track at position 0', () => {
    const queue: QueueItem[] = [
      { id: '1', status: 'playing', vote_count: 5, added_at: new Date('2024-01-01') },
      { id: '2', status: 'pending', vote_count: 10, added_at: new Date('2024-01-02') },
      { id: '3', status: 'pending', vote_count: 7, added_at: new Date('2024-01-03') },
    ]

    const reordered = reorderQueue(queue)

    expect(reordered[0].id).toBe('1')  // Currently playing stays first
    expect(reordered[0].status).toBe('playing')
  })

  it('sorts pending tracks by vote_count DESC, then added_at ASC', () => {
    const queue: QueueItem[] = [
      { id: '1', status: 'playing', vote_count: 5, added_at: new Date('2024-01-01') },
      { id: '2', status: 'pending', vote_count: 3, added_at: new Date('2024-01-02') },
      { id: '3', status: 'pending', vote_count: 10, added_at: new Date('2024-01-03') },
      { id: '4', status: 'pending', vote_count: 10, added_at: new Date('2024-01-01') },
    ]

    const reordered = reorderQueue(queue)

    expect(reordered[1].id).toBe('4')  // 10 votes, earlier timestamp
    expect(reordered[2].id).toBe('3')  // 10 votes, later timestamp
    expect(reordered[3].id).toBe('2')  // 3 votes
  })

  it('handles empty queue', () => {
    expect(reorderQueue([])).toEqual([])
  })

  it('handles queue with only currently playing track', () => {
    const queue: QueueItem[] = [
      { id: '1', status: 'playing', vote_count: 5, added_at: new Date('2024-01-01') },
    ]

    const reordered = reorderQueue(queue)
    expect(reordered).toHaveLength(1)
    expect(reordered[0].id).toBe('1')
  })
})
```

#### Frontend Unit Test Example

```typescript
// web/src/utils/time.test.ts
import { describe, it, expect } from 'bun:test'
import { formatDuration, timeRemaining } from './time'

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(59)).toBe('0:59')
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(125)).toBe('2:05')
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('handles negative durations', () => {
    expect(formatDuration(-10)).toBe('0:00')
  })
})

describe('timeRemaining', () => {
  it('calculates time remaining for track', () => {
    const trackDurationMs = 180000  // 3 minutes
    const progressMs = 60000         // 1 minute elapsed

    expect(timeRemaining(trackDurationMs, progressMs)).toBe(120000)  // 2 minutes left
  })

  it('returns 0 if track is complete', () => {
    expect(timeRemaining(180000, 180000)).toBe(0)
  })
})
```

#### React Component Unit Test

```typescript
// web/src/components/TrackItem.test.tsx
import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { TrackItem } from './TrackItem'

describe('TrackItem', () => {
  it('renders track information', () => {
    const track = {
      id: '1',
      name: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      duration_ms: 354000,
      vote_count: 5,
    }

    render(<TrackItem track={track} />)

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument()
    expect(screen.getByText('Queen')).toBeInTheDocument()
    expect(screen.getByText('5 votes')).toBeInTheDocument()
  })

  it('shows currently playing indicator', () => {
    const track = {
      id: '1',
      name: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      duration_ms: 180000,
      vote_count: 3,
      status: 'playing',
    }

    render(<TrackItem track={track} />)

    expect(screen.getByTestId('playing-indicator')).toBeInTheDocument()
  })
})
```

---

### Integration Tests

**Purpose:** Test how multiple parts of the system work together (e.g., API routes with database).

#### API Integration Test Example

```typescript
// server/tests/integration/parties.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { app } from '../../src/index'
import { db } from '../../src/db/client'
import { createTestUser, cleanupDatabase } from '../helpers/setup'

describe('POST /api/parties', () => {
  let testUser: { id: string; token: string }

  beforeEach(async () => {
    testUser = await createTestUser()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates a new party with valid data', async () => {
    const res = await app.request('/api/parties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.token}`,
      },
      body: JSON.stringify({
        name: 'Test Party',
        max_tracks_per_user: 5,
      }),
    })

    expect(res.status).toBe(200)
    
    const party = await res.json()
    expect(party.name).toBe('Test Party')
    expect(party.max_tracks_per_user).toBe(5)
    expect(party.host_id).toBe(testUser.id)

    // Verify in database
    const dbParty = await db.query.parties.findFirst({
      where: (parties, { eq }) => eq(parties.id, party.id),
    })
    expect(dbParty).toBeDefined()
    expect(dbParty?.name).toBe('Test Party')
  })

  it('returns 400 for invalid party name', async () => {
    const res = await app.request('/api/parties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.token}`,
      },
      body: JSON.stringify({
        name: '',  // Invalid: empty name
        max_tracks_per_user: 5,
      }),
    })

    expect(res.status).toBe(400)
    
    const error = await res.json()
    expect(error.message).toContain('name')
  })

  it('requires authentication', async () => {
    const res = await app.request('/api/parties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      body: JSON.stringify({
        name: 'Test Party',
        max_tracks_per_user: 5,
      }),
    })

    expect(res.status).toBe(401)
  })
})
```

#### Test Helpers

```typescript
// server/tests/helpers/setup.ts
import { db } from '../../src/db/client'
import { users, parties, tracks } from '../../src/db/schema'
import { sql } from 'drizzle-orm'

export async function createTestUser() {
  const user = await db.insert(users).values({
    id: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    spotify_id: `spotify-${Date.now()}`,
    access_token: 'test-token',
    refresh_token: 'test-refresh',
  }).returning()

  const token = generateJWT(user[0].id)

  return { ...user[0], token }
}

export async function cleanupDatabase() {
  await db.delete(tracks)
  await db.delete(parties)
  await db.delete(users)
}

export async function createTestParty(hostId: string) {
  const party = await db.insert(parties).values({
    id: crypto.randomUUID(),
    name: `Test Party ${Date.now()}`,
    host_id: hostId,
    max_tracks_per_user: 5,
  }).returning()

  return party[0]
}
```

---

### E2E Tests

**Purpose:** Test complete user workflows from browser perspective.

#### E2E Test Example with Playwright

```typescript
// web/tests/e2e/queue.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Queue Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.click('text=Login with Spotify')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parties')

    // Create or join party
    await page.click('text=Create Party')
    await page.fill('input[name="name"]', 'E2E Test Party')
    await page.click('button:has-text("Create")')
    await page.waitForURL(/\/party\/[a-z0-9-]+/)
  })

  test('user can add track to queue', async ({ page }) => {
    // Search for track
    await page.fill('input[placeholder="Search for songs..."]', 'Bohemian Rhapsody')
    await page.waitForSelector('text=Queen')

    // Add to queue
    await page.click('button:has-text("Add to Queue")')

    // Verify track appears in queue
    await expect(page.locator('text=Bohemian Rhapsody')).toBeVisible()
    await expect(page.locator('text=Queen')).toBeVisible()
  })

  test('user can upvote track in queue', async ({ page }) => {
    // Add track first
    await page.fill('input[placeholder="Search for songs..."]', 'Test Track')
    await page.click('button:has-text("Add to Queue")')

    // Find and click upvote button
    const trackItem = page.locator('text=Test Track').locator('..')
    const upvoteButton = trackItem.locator('button[aria-label="Upvote"]')
    
    await expect(upvoteButton).toBeVisible()
    await upvoteButton.click()

    // Verify vote count increased
    await expect(trackItem.locator('text=1 vote')).toBeVisible()
  })

  test('tracks reorder based on votes', async ({ page }) => {
    // Add multiple tracks
    await addTrackToQueue(page, 'Track A')
    await addTrackToQueue(page, 'Track B')
    await addTrackToQueue(page, 'Track C')

    // Upvote Track C twice
    await upvoteTrack(page, 'Track C')
    await page.waitForTimeout(500)  // Wait for reorder
    await upvoteTrack(page, 'Track C')
    await page.waitForTimeout(500)

    // Verify Track C moved up in queue
    const queueItems = await page.locator('[data-testid="queue-item"]').allTextContents()
    expect(queueItems[1]).toContain('Track C')  // Position 1 (after currently playing)
  })

  test('respects max tracks per user limit', async ({ page }) => {
    // Add max tracks (5)
    for (let i = 1; i <= 5; i++) {
      await addTrackToQueue(page, `Track ${i}`)
    }

    // Try to add 6th track
    await page.fill('input[placeholder="Search for songs..."]', 'Track 6')
    const addButton = page.locator('button:has-text("Add to Queue")')
    
    // Expect button to be disabled or show error
    await expect(addButton).toBeDisabled()
    await expect(page.locator('text=You have reached the maximum')).toBeVisible()
  })
})

// Helper functions
async function addTrackToQueue(page: Page, trackName: string) {
  await page.fill('input[placeholder="Search for songs..."]', trackName)
  await page.waitForSelector(`text=${trackName}`)
  await page.click('button:has-text("Add to Queue")')
  await page.waitForSelector(`[data-testid="queue-item"]:has-text("${trackName}")`)
}

async function upvoteTrack(page: Page, trackName: string) {
  const trackItem = page.locator(`text=${trackName}`).locator('..')
  await trackItem.locator('button[aria-label="Upvote"]').click()
}
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
bun test

# Run tests in watch mode (auto-rerun on changes)
bun test --watch

# Run specific test file
bun test src/utils/queue.test.ts

# Run tests matching pattern
bun test --test-name-pattern "reorderQueue"

# Run with coverage
bun test --coverage

# Run in bail mode (stop on first failure)
bun test --bail

# Run tests in specific directory
bun test tests/integration/
```

### Server Tests

```bash
cd server

# All tests
bun test

# Unit tests only
bun test src/**/*.test.ts

# Integration tests only
bun test tests/integration/

# Watch mode for TDD
bun test --watch

# With coverage
bun test --coverage
```

### Frontend Tests

```bash
cd web

# All tests
bun test

# Component tests
bun test src/components/

# Hook tests
bun test src/hooks/

# E2E tests (Playwright)
bunx playwright test

# E2E with UI
bunx playwright test --ui

# E2E specific browser
bunx playwright test --project=chromium
```

### Root Commands (Convenience)

```bash
# From project root

# Test everything
bun run test:all

# Test backend
bun run test:server

# Test frontend
bun run test:web

# E2E tests
bun run test:e2e

# Coverage for all
bun run test:coverage
```

**Add to root `package.json`:**

```json
{
  "scripts": {
    "test:all": "bun test && cd web && bun test && bunx playwright test",
    "test:server": "cd server && bun test",
    "test:web": "cd web && bun test",
    "test:e2e": "cd web && bunx playwright test",
    "test:coverage": "cd server && bun test --coverage && cd ../web && bun test --coverage"
  }
}
```

---

## Test Coverage

### Generating Coverage Reports

```bash
# Generate coverage
bun test --coverage

# Coverage with HTML report
bun test --coverage --coverage-reporter=html

# View HTML report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

### Coverage Thresholds

**Configure in `bunfig.toml` or `package.json`:**

```toml
# bunfig.toml
[test]
coverage = true
coverageThreshold = 80
coverageDirectory = "coverage"
coverageReporter = ["text", "html", "lcov"]
```

### What to Measure

**Focus coverage on:**
- ✅ Business logic (queue ordering, vote counting, state machine)
- ✅ API endpoints (all routes and error cases)
- ✅ Database queries
- ✅ Utility functions
- ✅ Service layers (Spotify integration, authentication)

**Don't obsess over coverage for:**
- ⚠️ Trivial getters/setters
- ⚠️ Type definitions
- ⚠️ Configuration files
- ⚠️ Generated code (OpenAPI client)

---

## Testing Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('calculates total vote count correctly', () => {
  // Arrange: Set up test data
  const track = {
    id: '1',
    votes: [
      { user_id: 'user1', value: 1 },
      { user_id: 'user2', value: 1 },
      { user_id: 'user3', value: 1 },
    ],
  }

  // Act: Execute the code being tested
  const total = calculateVoteCount(track)

  // Assert: Verify the result
  expect(total).toBe(3)
})
```

### 2. Test One Thing Per Test

```typescript
// ❌ Bad: Testing multiple things
it('handles party operations', () => {
  const party = createParty({ name: 'Test' })
  expect(party.name).toBe('Test')
  
  updateParty(party.id, { name: 'Updated' })
  expect(party.name).toBe('Updated')
  
  deleteParty(party.id)
  expect(findParty(party.id)).toBeNull()
})

// ✅ Good: Separate tests for each operation
describe('Party operations', () => {
  it('creates party with given name', () => {
    const party = createParty({ name: 'Test' })
    expect(party.name).toBe('Test')
  })

  it('updates party name', () => {
    const party = createParty({ name: 'Test' })
    updateParty(party.id, { name: 'Updated' })
    expect(party.name).toBe('Updated')
  })

  it('deletes party', () => {
    const party = createParty({ name: 'Test' })
    deleteParty(party.id)
    expect(findParty(party.id)).toBeNull()
  })
})
```

### 3. Use Descriptive Test Names

```typescript
// ❌ Bad: Vague test names
it('works', () => { ... })
it('test1', () => { ... })
it('returns correct value', () => { ... })

// ✅ Good: Descriptive test names
it('keeps currently playing track at position 0', () => { ... })
it('sorts pending tracks by vote count descending', () => { ... })
it('returns 400 when party name is empty', () => { ... })
```

### 4. Don't Test Implementation Details

```typescript
// ❌ Bad: Testing implementation (internal state)
it('sets isLoading to true', () => {
  const component = render(<TrackList />)
  expect(component.instance().state.isLoading).toBe(true)
})

// ✅ Good: Testing behavior (what user sees)
it('shows loading spinner while fetching tracks', () => {
  render(<TrackList />)
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
})
```

### 5. Use Factories for Test Data

```typescript
// server/tests/helpers/factories.ts
export function createTestTrack(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    duration_ms: 180000,
    spotify_id: `spotify:track:${Date.now()}`,
    added_by: 'user-1',
    added_at: new Date(),
    vote_count: 0,
    status: 'pending',
    ...overrides,
  }
}

export function createTestParty(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Test Party',
    host_id: 'user-1',
    max_tracks_per_user: 5,
    created_at: new Date(),
    ...overrides,
  }
}

// Usage in tests
it('adds track to queue', () => {
  const track = createTestTrack({ name: 'Custom Track' })
  const party = createTestParty()
  
  addToQueue(party.id, track)
  // ...
})
```

### 6. Clean Up After Tests

```typescript
import { afterEach, beforeEach } from 'bun:test'

describe('Database operations', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('creates party', async () => {
    // Test runs in clean database
  })
})
```

### 7. Mock External Dependencies

```typescript
import { mock } from 'bun:test'
import { spotifyAPI } from '../services/spotify'

// Mock Spotify API calls
mock.module('../services/spotify', () => ({
  spotifyAPI: {
    getCurrentTrack: mock(() => Promise.resolve({
      id: 'track-1',
      name: 'Test Track',
      progress_ms: 30000,
    })),
    
    pausePlayback: mock(() => Promise.resolve()),
    
    playTrack: mock((trackId) => Promise.resolve()),
  },
}))

it('handles playback control', async () => {
  await playNextTrack('party-1')
  
  expect(spotifyAPI.playTrack).toHaveBeenCalledWith('track-1')
})
```

---

## When to Write Tests

### During Development (TDD Approach)

**1. Write test first (Red)**
```typescript
it('formats duration in MM:SS format', () => {
  expect(formatDuration(125)).toBe('2:05')
})
// Test fails - function doesn't exist yet
```

**2. Write minimal code to pass (Green)**
```typescript
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
// Test passes
```

**3. Refactor if needed (Refactor)**
```typescript
function formatDuration(seconds: number): string {
  if (seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
// All tests still pass, code is better
```

### Test-First Workflow for Features

**Example: Adding voting feature**

```typescript
// Step 1: Write failing test
describe('Vote system', () => {
  it('increments vote count when user upvotes', async () => {
    const track = createTestTrack({ vote_count: 5 })
    const user = createTestUser()
    
    await upvoteTrack(track.id, user.id)
    
    const updated = await getTrack(track.id)
    expect(updated.vote_count).toBe(6)
  })
})
// ❌ Test fails - upvoteTrack doesn't exist

// Step 2: Implement minimal code
async function upvoteTrack(trackId: string, userId: string) {
  await db.update(tracks)
    .set({ vote_count: sql`vote_count + 1` })
    .where(eq(tracks.id, trackId))
}
// ✅ Test passes

// Step 3: Add edge case tests
it('prevents duplicate votes from same user', async () => {
  const track = createTestTrack({ vote_count: 5 })
  const user = createTestUser()
  
  await upvoteTrack(track.id, user.id)
  await upvoteTrack(track.id, user.id)  // Try to vote again
  
  const updated = await getTrack(track.id)
  expect(updated.vote_count).toBe(6)  // Should only count once
})
// ❌ Test fails - need to track user votes

// Step 4: Implement vote tracking
// Add votes table and check before incrementing
// ✅ All tests pass
```

### When to Write Tests After Code

**It's OK to write tests after for:**
- 🔧 Quick prototypes or spikes
- 🎨 UI styling (test behavior, not appearance)
- 📝 Initial exploration of new libraries

**But write tests before shipping:**
- ✅ All API endpoints
- ✅ All business logic
- ✅ All critical user flows
- ✅ All bug fixes (test that reproduces bug, then fix it)

---

## Mocking & Fixtures

### Mocking with Bun

```typescript
import { mock, spyOn } from 'bun:test'

// Mock a function
const mockFn = mock(() => 'mocked value')
mockFn()
expect(mockFn).toHaveBeenCalled()

// Spy on existing function
const spy = spyOn(console, 'log')
console.log('test')
expect(spy).toHaveBeenCalledWith('test')

// Mock module
mock.module('./spotify', () => ({
  getCurrentTrack: mock(() => ({ id: '1', name: 'Test' })),
}))
```

### Test Fixtures

```typescript
// server/tests/fixtures/tracks.json
{
  "bohemianRhapsody": {
    "id": "track-1",
    "name": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "duration_ms": 354000,
    "spotify_id": "spotify:track:123"
  },
  "stairwayToHeaven": {
    "id": "track-2",
    "name": "Stairway to Heaven",
    "artist": "Led Zeppelin",
    "album": "Led Zeppelin IV",
    "duration_ms": 482000,
    "spotify_id": "spotify:track:456"
  }
}
```

```typescript
// Use fixtures in tests
import fixtures from '../fixtures/tracks.json'

it('adds track to queue', () => {
  const track = fixtures.bohemianRhapsody
  addToQueue('party-1', track)
  // ...
})
```

---

## Testing Database Code

### Test Database Setup

```typescript
// server/tests/helpers/setup.ts
import { db } from '../../src/db/client'
import { sql } from 'drizzle-orm'

export async function setupTestDatabase() {
  // Use separate test database
  process.env.DATABASE_URL = 'postgresql://localhost:5432/snoppify_test'
  
  // Run migrations
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (...)
  `)
}

export async function cleanupDatabase() {
  // Clear all tables
  await db.delete(tracks)
  await db.delete(votes)
  await db.delete(queue)
  await db.delete(parties)
  await db.delete(users)
}

export async function resetDatabase() {
  await cleanupDatabase()
  await setupTestDatabase()
}
```

### Database Test Example

```typescript
describe('Queue database operations', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('retrieves queue in correct order', async () => {
    const party = await createTestParty()
    
    // Insert tracks with different vote counts
    await db.insert(queue).values([
      { party_id: party.id, track_id: 't1', vote_count: 5, status: 'pending' },
      { party_id: party.id, track_id: 't2', vote_count: 10, status: 'pending' },
      { party_id: party.id, track_id: 't3', vote_count: 3, status: 'playing' },
    ])

    // Get ordered queue
    const ordered = await getPartyQueue(party.id)

    expect(ordered[0].track_id).toBe('t3')  // Currently playing first
    expect(ordered[1].track_id).toBe('t2')  // Highest votes next
    expect(ordered[2].track_id).toBe('t1')  // Lower votes last
  })
})
```

---

## Testing Real-Time Features

### Testing Socket.io

```typescript
// server/tests/integration/sockets.test.ts
import { io as ioc, Socket as ClientSocket } from 'socket.io-client'
import { createServer } from '../../src/index'

describe('Socket.io real-time updates', () => {
  let serverSocket: ServerSocket
  let clientSocket: ClientSocket

  beforeEach((done) => {
    const server = createServer()
    server.listen(() => {
      const port = server.address().port
      clientSocket = ioc(`http://localhost:${port}`)
      clientSocket.on('connect', done)
    })
  })

  afterEach(() => {
    clientSocket.close()
    serverSocket.close()
  })

  it('broadcasts queue update to all party members', (done) => {
    const partyId = 'party-1'
    
    // Join party room
    clientSocket.emit('join-party', partyId)
    
    // Listen for queue update
    clientSocket.on('queue-updated', (data) => {
      expect(data.party_id).toBe(partyId)
      expect(data.queue).toBeDefined()
      done()
    })
    
    // Trigger queue update
    addTrackToQueue(partyId, createTestTrack())
  })

  it('sends vote update to party members', (done) => {
    const partyId = 'party-1'
    
    clientSocket.emit('join-party', partyId)
    
    clientSocket.on('vote-updated', (data) => {
      expect(data.track_id).toBe('track-1')
      expect(data.vote_count).toBe(6)
      done()
    })
    
    upvoteTrack('track-1', 'user-1')
  })
})
```

---

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: snoppify_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run server tests
        run: cd server && bun test --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/snoppify_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run frontend tests
        run: cd web && bun test --coverage
      
      - name: Install Playwright
        run: cd web && bunx playwright install --with-deps
      
      - name: Run E2E tests
        run: cd web && bunx playwright test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./server/coverage/lcov.info,./web/coverage/lcov.info
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests on changed files
cd server && bun test --bail
cd ../web && bun test --bail
```

---

## Summary

### Test Checklist for Every Feature

When implementing a new feature, ensure you have:

- [ ] **Unit tests** for business logic and utilities
- [ ] **Integration tests** for API endpoints
- [ ] **E2E tests** for critical user flows
- [ ] **Edge case tests** (empty data, max limits, errors)
- [ ] **Error handling tests** (4xx, 5xx responses)
- [ ] **Tests pass in CI** before merging
- [ ] **Coverage meets threshold** (80%+ overall)

### Quick Reference

```bash
# Development
bun test --watch                # TDD mode
bun test path/to/file.test.ts  # Single file

# Coverage
bun test --coverage             # Generate report
open coverage/index.html        # View report

# E2E
bunx playwright test            # Run E2E tests
bunx playwright test --ui       # Interactive mode

# CI
bun test --bail                 # Stop on first failure
bun test --coverage --coverage-threshold=80
```

### Key Takeaways

1. ✅ **Write tests as you code** - Don't wait until the end
2. ✅ **Use Bun test** - Fast, built-in, Jest-compatible
3. ✅ **Test behavior, not implementation** - Focus on what users see
4. ✅ **Keep tests fast** - Fast tests = frequent runs = early bug detection
5. ✅ **100% coverage on critical paths** - Queue ordering, voting, state machine
6. ✅ **Use factories and fixtures** - Reusable test data
7. ✅ **Mock external dependencies** - Spotify API, payment services
8. ✅ **Run tests in CI** - Every commit and PR

---

**Happy testing! 🎵✅**

Write tests with confidence, ship code with speed.
