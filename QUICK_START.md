# Quick Start Guide for Rewrite Implementation

## For AI Agents / Developers Starting the Rewrite

This guide helps you get started quickly with the Snoppify rewrite using the documentation provided.

---

## Step 1: Read the Documentation (30 minutes)

**Read in this order:**

1. **REWRITE_SUMMARY.md** (10 min) - Get the big picture
   - What is Snoppify
   - Why rewrite
   - Tech stack choices
   - Critical features overview

2. **FEATURE_ANALYSIS.md** (15 min) - Understand the features
   - Skim all 10 features
   - Focus on: Queue Management, Voting, Playback Control, Real-Time

3. **IMPLEMENTATION_GUIDE.md** (skip for now, reference as needed)
   - Bookmark this for when implementing specific features
   - Contains critical algorithms with code examples

4. **REWRITE_SPECIFICATION.md** (5 min skim)
   - Look at database schema
   - Look at API endpoint structure
   - Note the tech stack and OpenAPI workflow

5. **ROADMAP.md** (reference as you go)
   - Use this as your daily task list

6. **DEPLOYMENT_GUIDE.md** (optional)
   - Deployment options from $0/month (self-hosted) to cloud services

---

## Step 2: Set Up Your Environment (Day 1)

### Prerequisites
```bash
# Install required tools
bun --version  # Should be >= 1.0
docker --version
docker-compose --version
```

**Why Bun?** Bun is an all-in-one JavaScript runtime that replaces Node.js and multiple tools:
- ✅ **Runtime:** 3x faster than Node.js, **no Node.js needed**
- ✅ **Package Manager:** Fast, npm-compatible (replaces npm/yarn/pnpm)
- ✅ **Bundler:** Faster than esbuild, built-in (replaces Webpack/Rollup/Vite)
- ✅ **Test Runner:** Jest-compatible, built-in (replaces Jest/Vitest)
- ✅ **Transpiler:** TypeScript & JSX out-of-the-box (no babel/tsc needed)

This means **no Node.js, no monorepo complexity, fewer dependencies, faster builds, simpler setup**.

### Clone and Initialize
```bash
# Clone repository
git clone https://github.com/Snoppify/snoppify.git
cd snoppify

# Create new branch for rewrite
git checkout -b rewrite/setup

# Create simple structure (no monorepo)
mkdir -p web/src server/src
```

### Root Package.json (Convenience Scripts Only)
```bash
# Root package.json - NOT a workspace, just convenience scripts
cat > package.json << 'EOF'
{
  "name": "snoppify",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev:server": "cd server && bun run dev",
    "dev:web": "cd web && bun run dev",
    "dev": "concurrently \"bun run dev:server\" \"bun run dev:web\"",
    "build:server": "cd server && bun run build",
    "build:web": "cd web && bun run build",
    "build": "bun run build:server && bun run build:web",
    "test:server": "cd server && bun test",
    "test:web": "cd web && bun test",
    "test": "bun run test:server && bun run test:web",
    "generate:openapi": "cd server && bun run generate:openapi",
    "generate:client": "cd web && bun run generate:client",
    "generate": "bun run generate:openapi && bun run generate:client",
    "docker:dev": "docker compose up",
    "docker:prod": "docker compose -f docker-compose.prod.yml up -d"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
EOF

# Install
bun install
```

### Set Up Docker Compose
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: snoppify_dev
      POSTGRES_USER: snoppify
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U snoppify"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Create Environment File
```bash
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://snoppify:password@localhost:5432/snoppify_dev

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_client_id_here
FACEBOOK_CLIENT_SECRET=your_client_secret_here

# JWT
JWT_SECRET=your_secret_here_change_in_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Client URL (for OAuth redirects)
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
EOF

# Copy to actual .env file
cp .env.example .env

# Edit .env with your actual credentials
# Get Spotify credentials from: https://developer.spotify.com/dashboard
```

---

## Step 3: Set Up Backend (Day 1-2)

### Initialize Server App
```bash
cd server

# Initialize Bun project
bun init -y

# Install dependencies
bun add hono @hono/zod-openapi
bun add drizzle-orm postgres
bun add socket.io
bun add zod
bun add pino
bun add dotenv

# Install dev dependencies
bun add -D drizzle-kit
bun add -D @types/bun
bun add -D typescript
```

### Create Basic Server Structure with OpenAPI
```bash
mkdir -p src/{routes,services,db,auth,middleware,types,utils}

# Create main entry point with OpenAPI support
cat > src/index.ts << 'EOF'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { swaggerUI } from '@hono/swagger-ui'
import pino from 'pino'

const app = new OpenAPIHono()
const log = pino()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// OpenAPI documentation endpoint
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Snoppify API',
    version: '2.0.0',
    description: 'Democratic party music queue application API',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
})

// Swagger UI for testing API
app.get('/api/docs', swaggerUI({ url: '/openapi.json' }))

const port = Number(process.env.PORT) || 3000
log.info(`Server starting on port ${port}`)
log.info(`API documentation available at http://localhost:${port}/api/docs`)

// Export for Bun to serve
export default {
  port,
  fetch: app.fetch,
}
EOF

# Update package.json with OpenAPI generation script
cat > package.json << 'EOF'
{
  "name": "@snoppify/server",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "start": "bun dist/index.js",
    "test": "bun test",
    "generate:openapi": "bun run src/index.ts --generate-spec > openapi.json",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
EOF
```

### Example: Create API Route with OpenAPI

```bash
# Create parties route with OpenAPI annotations
cat > src/routes/parties.ts << 'EOF'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

// Define schemas with Zod (validation + OpenAPI generation)
const PartySchema = z.object({
  id: z.string().openapi({ example: 'party_123' }),
  name: z.string().min(1).max(100).openapi({ example: 'Friday Night Party' }),
  hostUserId: z.string(),
  maxTracksPerUser: z.number().int().min(1).max(10).default(5),
  status: z.enum(['active', 'paused', 'ended']).default('active'),
  createdAt: z.string().datetime(),
})

const CreatePartySchema = PartySchema.pick({ name: true, maxTracksPerUser: true })

// Define route with OpenAPI annotations
const createPartyRoute = createRoute({
  method: 'post',
  path: '/api/parties',
  tags: ['Parties'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePartySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Party created successfully',
      content: {
        'application/json': {
          schema: PartySchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

const app = new OpenAPIHono()

// Implement route with full type safety
app.openapi(createPartyRoute, async (c) => {
  const body = c.req.valid('json') // Fully typed!
  
  // Your implementation here
  const party = {
    id: 'party_' + Math.random().toString(36).substr(2, 9),
    name: body.name,
    hostUserId: 'user_123', // From auth middleware
    maxTracksPerUser: body.maxTracksPerUser ?? 5,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  }
  
  return c.json(party, 200)
})

export default app
EOF
```

### Generate OpenAPI Spec

```bash
# Generate OpenAPI spec
bun run generate:openapi

# This creates openapi.json file
# Frontend will use this to generate TypeScript client
```

### Set Up Database Schema
```bash
# Create schema file
cat > src/db/schema.ts << 'EOF'
import { pgTable, text, timestamp, integer, jsonb, serial, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  displayName: text('display_name'),
  profilePictureUrl: text('profile_picture_url'),
  authProvider: text('auth_provider').notNull(),
  authProviderId: text('auth_provider_id').notNull(),
  spotifyAccessToken: text('spotify_access_token'),
  spotifyRefreshToken: text('spotify_refresh_token'),
  spotifyTokenExpiresAt: timestamp('spotify_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  authProviderIdx: index('users_auth_provider_idx').on(table.authProvider, table.authProviderId)
}))

export const parties = pgTable('parties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hostUserId: text('host_user_id').references(() => users.id).notNull(),
  mainPlaylistId: text('main_playlist_id'),
  backupPlaylistUri: text('backup_playlist_uri'),
  activeDeviceId: text('active_device_id'),
  maxTracksPerUser: integer('max_tracks_per_user').default(5).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  hostIdx: index('parties_host_user_id_idx').on(table.hostUserId),
  statusIdx: index('parties_status_idx').on(table.status)
}))

export const tracks = pgTable('tracks', {
  id: text('id').primaryKey(), // Spotify track ID
  name: text('name').notNull(),
  artists: jsonb('artists').notNull(),
  album: jsonb('album').notNull(),
  durationMs: integer('duration_ms').notNull(),
  spotifyUri: text('spotify_uri').notNull(),
  previewUrl: text('preview_url'),
  audioFeatures: jsonb('audio_features'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const queue = pgTable('queue', {
  id: serial('id').primaryKey(),
  partyId: text('party_id').references(() => parties.id, { onDelete: 'cascade' }).notNull(),
  trackId: text('track_id').references(() => tracks.id).notNull(),
  addedByUserId: text('added_by_user_id').references(() => users.id).notNull(),
  voteCount: integer('vote_count').default(0).notNull(),
  position: integer('position').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'playing', 'played', 'removed'
  addedAt: timestamp('added_at').defaultNow().notNull(),
  playedAt: timestamp('played_at')
}, (table) => ({
  partyIdx: index('queue_party_id_idx').on(table.partyId),
  statusIdx: index('queue_status_idx').on(table.status),
  trackIdx: index('queue_track_id_idx').on(table.trackId),
  addedByIdx: index('queue_added_by_user_id_idx').on(table.addedByUserId)
}))

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  queueId: integer('queue_id').references(() => queue.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueVote: uniqueIndex('votes_queue_id_user_id_idx').on(table.queueId, table.userId)
}))

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  partyId: text('party_id').references(() => parties.id),
  expiresAt: timestamp('expires_at').notNull(),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt)
}))
EOF

# Create Drizzle config
cat > drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
EOF

# Generate and run migrations
bun run db:generate
bun run db:migrate
```

### Test Server
```bash
# Start server
bun run dev

# In another terminal, test health endpoint
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## Step 4: Set Up Frontend (Day 2)

### Initialize Web App
```bash
cd ../../  # Back to root
cd web

# Create Vite + React + TypeScript project
bun create vite . --template react-ts

# Install dependencies
bun install
bun add zustand
bun add react-router-dom
bun add socket.io-client
bun add @tanstack/react-query

# Install Tailwind
bun add -D tailwindcss postcss autoprefixer
bunx tailwindcss init -p

# Install Shadcn/ui
bunx shadcn-ui@latest init

# Install OpenAPI client generator
bun add -D @hey-api/openapi-ts
```

### Generate TypeScript Client from OpenAPI

```bash
# Add generation script to package.json
cat > package.json << 'EOF'
{
  "name": "@snoppify/web",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "bun test",
    "generate:client": "bunx @hey-api/openapi-ts -i ../server/openapi.json -o ./src/client"
  }
}
EOF

# Generate typed client from backend's OpenAPI spec
bun run generate:client

# This creates:
# - src/client/types.gen.ts (TypeScript types)
# - src/client/services.gen.ts (API functions)
# - src/client/schemas.gen.ts (Zod schemas)
```

### Example: Using Generated Client

```bash
# Create a page that uses the generated client
cat > src/pages/CreateParty.tsx << 'EOF'
import { useState } from 'react'
import { createParty } from '@/client/services.gen'
import type { PartySchema } from '@/client/types.gen'

export function CreateParty() {
  const [partyName, setPartyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [party, setParty] = useState<PartySchema | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Fully typed API call - autocomplete works!
    const { data, error } = await createParty({
      body: {
        name: partyName,
        maxTracksPerUser: 5,
      },
    })
    
    if (error) {
      console.error('Failed to create party:', error)
      setLoading(false)
      return
    }
    
    // data is fully typed as PartySchema
    setParty(data)
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create a Party</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          placeholder="Party name"
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Creating...' : 'Create Party'}
        </button>
      </form>
      
      {party && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>Party created: {party.name}</p>
          <p>ID: {party.id}</p>
        </div>
      )}
    </div>
  )
}
EOF
```

### Type Safety Workflow

```bash
# 1. Backend developer defines API route with OpenAPI
cd ../server
# Edit src/routes/parties.ts

# 2. Generate OpenAPI spec
bun run generate:openapi

# 3. Frontend automatically gets new types
cd ../web
bun run generate:client

# 4. Use typed API in frontend
# Types are synchronized! Compile errors if API changes!
```

### Configure Tailwind
```bash
# Update tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
}
EOF
```

### Create Basic App Structure
```bash
mkdir -p src/{components,pages,stores,hooks,lib,types}

# Create basic router
cat > src/App.tsx << 'EOF'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Party } from './pages/Party'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/party/:id?" element={<Party />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
EOF

# Create placeholder pages
cat > src/pages/Landing.tsx << 'EOF'
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Snoppify</h1>
        <p className="text-xl mb-8">Democratic party playlists</p>
        <Link 
          to="/login" 
          className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}
EOF

cat > src/pages/Login.tsx << 'EOF'
export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Login to Snoppify</h1>
        <div className="space-y-4">
          <button className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600">
            Login with Spotify
          </button>
          <button className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600">
            Login with Google
          </button>
          <button className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800">
            Login with Facebook
          </button>
        </div>
      </div>
    </div>
  )
}
EOF

cat > src/pages/Party.tsx << 'EOF'
export function Party() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Party</h1>
      <p>Queue and playback controls will go here</p>
    </div>
  )
}
EOF
```

### Update Package.json
```bash
cat > package.json << 'EOF'
{
  "name": "@snoppify/web",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  }
}
EOF
```

### Test Frontend
```bash
bun run dev
# Visit http://localhost:5173
```

---

## Step 5: First Feature - Authentication (Week 3)

Now follow **ROADMAP.md** Phase 2 (Week 3) for detailed authentication implementation.

Key files to reference:
- **IMPLEMENTATION_GUIDE.md** - For token refresh patterns
- **REWRITE_SPECIFICATION.md** - For auth API design
- **FEATURE_ANALYSIS.md** - Section 1 for requirements

---

## Development Workflow

### Daily Workflow
1. Check **ROADMAP.md** for today's tasks
2. Implement features
3. Write tests as you go
4. Commit frequently with clear messages
5. Update ROADMAP.md with progress (check off completed tasks)

### When Implementing a Feature
1. Read feature description in **FEATURE_ANALYSIS.md**
2. Check critical implementation details in **IMPLEMENTATION_GUIDE.md**
3. Look at API design in **REWRITE_SPECIFICATION.md**
4. Follow day-by-day tasks in **ROADMAP.md**
5. Write tests to verify it works

### Testing Your Code
```bash
# Backend tests with Bun's built-in test runner
cd apps/server
bun test

# Watch mode
bun test --watch

# With coverage
bun test --coverage

# Frontend tests with Bun test
cd apps/web
bun test

# E2E tests (after Playwright setup)
cd ../..
bunx playwright test
```

### Common Commands
```bash
# Start everything
bun run dev

# Start database
docker-compose up -d

# Stop database
docker-compose down

# View database
cd apps/server && bun run db:studio

# Generate new migration
cd apps/server && bun run db:generate

# Run migrations
cd apps/server && bun run db:migrate

# Format code
bun run format

# Lint code
bun run lint

# Run tests
bun test

# Build for production
bun run build
```

---

## Key Reminders

### Must Preserve These Patterns
1. **Queue ordering:** Currently playing at position 0, others by votes
2. **State machine:** Exact logic from IMPLEMENTATION_GUIDE.md
3. **Playlist sync:** Database is source of truth
4. **Vote toggle:** Handle race conditions with transactions
5. **Token refresh:** Background job, automatic
6. **Real-time:** Broadcast after DB commits

### Don't Do This
❌ Sort queue in application code (use SQL ORDER BY)  
❌ Broadcast events before database commits  
❌ Skip database transactions for queue operations  
❌ Allow users to vote on own tracks  
❌ Forget to refresh Spotify tokens  
❌ Allow currently playing track to be removed  

### Do This
✅ Use transactions for all queue operations  
✅ Validate inputs with Zod schemas  
✅ Write tests for critical paths  
✅ Handle errors gracefully  
✅ Log important events  
✅ Keep code simple and readable  

---

## Getting Help

### Documentation Files
- **REWRITE_SUMMARY.md** - Quick overview
- **FEATURE_ANALYSIS.md** - Feature details
- **IMPLEMENTATION_GUIDE.md** - Critical patterns with code
- **REWRITE_SPECIFICATION.md** - Architecture and APIs
- **ROADMAP.md** - Day-by-day tasks

### External Resources
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [React Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)

---

## Next Steps

1. ✅ Set up development environment (above)
2. ✅ Start database and test connection
3. ✅ Create backend structure and health check
4. ✅ Create frontend structure and basic pages
5. → Implement authentication (Week 3)
6. → Follow ROADMAP.md for remaining features

**You're ready to start building! Good luck! 🚀**
