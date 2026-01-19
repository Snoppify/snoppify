# Snoppify Rewrite Documentation

This directory contains comprehensive documentation for rewriting Snoppify from Vue 2 to a modern stack (React + Bun + PostgreSQL).

## 📚 Documentation Index

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - Start here! Step-by-step setup guide for developers/AI agents
- **[REWRITE_SUMMARY.md](./REWRITE_SUMMARY.md)** - Executive summary and quick reference

### Understanding the Current System
- **[FEATURE_ANALYSIS.md](./FEATURE_ANALYSIS.md)** - Comprehensive breakdown of all 10 core features
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Critical algorithms and patterns that must be preserved

### Building the New System
- **[REWRITE_SPECIFICATION.md](./REWRITE_SPECIFICATION.md)** - Complete tech stack, architecture, and API design
- **[ROADMAP.md](./ROADMAP.md)** - 12-week implementation roadmap with daily tasks

### Original Documentation
- **[README.md](./README.md)** - Original project README (for reference)

---

## 🎯 What is Snoppify?

Snoppify is a **democratic party music queue application** that integrates with Spotify. It allows multiple users at a party to:
- Search and add songs to a shared queue
- Vote on tracks to determine play order
- See who added each song
- Control playback (host only)

**The core value:** Keeps party playlists fair and democratic - no one person dominates the music.

---

## 🚀 Quick Start for Implementers

**For AI Agents / Developers:**

1. **Read First:** [QUICK_START.md](./QUICK_START.md) - Follow the step-by-step setup
2. **Understand Features:** [FEATURE_ANALYSIS.md](./FEATURE_ANALYSIS.md) - Sections 1-4
3. **Reference Patterns:** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Keep open while coding
4. **Follow Roadmap:** [ROADMAP.md](./ROADMAP.md) - Use as daily task list

**Estimated reading time:** 30-45 minutes to understand everything

---

## 🏗️ New Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** (dev) / **Bun bundler** (production builds)
- **Tailwind CSS** + Shadcn/ui (styling)
- **Zustand** (state management)
- **React Router** (routing)
- **Socket.io Client** (real-time)

### Backend
- **Bun** (runtime)
- **Hono** (web framework)
- **Drizzle ORM** (database)
- **PostgreSQL** (database)
- **Redis** (sessions + caching)
- **Socket.io** (real-time)

### Development (All-in-One with Bun)
- **Runtime:** Bun (3x faster than Node.js)
- **Package Manager:** Bun (replaces npm/yarn/pnpm)
- **Bundler:** Bun build (replaces Webpack/esbuild)
- **Test Runner:** Bun test (replaces Jest/Vitest)
- **Transpiler:** Built-in TypeScript/JSX (no babel/tsc)
- **Monorepo:** Bun workspaces (replaces Turborepo)

### Why These Choices?
- **React:** Best AI tooling, huge ecosystem, excellent TypeScript support
- **Bun:** All-in-one tool - fewer dependencies, faster everything, simpler setup
- **PostgreSQL:** Battle-tested, ACID compliance, powerful queries
- **Redis:** Fast sessions, pub/sub for real-time, excellent caching

---

## 📖 Documentation Guide

### For Understanding Current System

**"What does Snoppify do?"**
→ Read [FEATURE_ANALYSIS.md](./FEATURE_ANALYSIS.md)

**"How does the queue ordering work?"**
→ Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Section 1

**"How does the voting system work?"**
→ Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Section 4

**"How does playback automation work?"**
→ Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Section 2

### For Building New System

**"How do I set up the development environment?"**
→ Follow [QUICK_START.md](./QUICK_START.md) - Steps 1-4

**"What should I build first?"**
→ Follow [ROADMAP.md](./ROADMAP.md) - Start with Phase 1

**"What's the database schema?"**
→ See [REWRITE_SPECIFICATION.md](./REWRITE_SPECIFICATION.md) - Database Schema section

**"What API endpoints do I need?"**
→ See [REWRITE_SPECIFICATION.md](./REWRITE_SPECIFICATION.md) - API Endpoints section

**"How do I implement authentication?"**
→ Follow [ROADMAP.md](./ROADMAP.md) - Phase 2 (Week 3)

---

## ✅ Critical Patterns to Preserve

These patterns are **battle-tested** and must be implemented exactly:

### 1. Queue Reordering
```
Currently playing track ALWAYS at position 0
Other tracks sorted by: vote_count DESC, added_at ASC
Update Spotify playlist to match database order
```

### 2. State Machine
```
States: paused → playing → waitingForNextSong → playSong
Track ending detected at < 10 seconds remaining
Empty queue falls back to backup playlist
All transitions broadcast via Socket.io
```

### 3. Playlist Sync
```
Database is source of truth
→ Calculate diff with Spotify playlist
→ Apply changes (add/remove/reorder)
→ Background job detects and fixes drift every 5 seconds
```

### 4. Vote Toggle
```
Check if vote exists
→ If yes: delete vote (unvote)
→ If no: insert vote
→ Update vote count
→ Reorder queue
→ Sync playlist
→ Broadcast update
Use database transaction to prevent race conditions
```

### 5. Token Refresh
```
Background job runs every 5 minutes
Refresh tokens expiring within 10 minutes
Update database with new tokens
Retry on API call if token expired
```

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for complete code examples.

---

## 📅 Implementation Timeline

**12-Week Plan** (see [ROADMAP.md](./ROADMAP.md) for details):

- **Weeks 1-2:** Foundation (monorepo, database, scaffolding)
- **Week 3:** Authentication (OAuth, sessions, JWT)
- **Week 4:** Party Management (create, join, settings)
- **Week 5:** Queue Management (add, remove, validation)
- **Week 6:** Voting System (vote/unvote, reordering)
- **Week 7:** Search & Spotify Integration
- **Week 8:** Playback Control (state machine)
- **Week 9:** Real-Time Communication (Socket.io)
- **Week 10:** Background Jobs (token refresh, playlist sync)
- **Week 11:** Polish & Testing (tests, error handling, UI polish)
- **Week 12:** DevOps & Deployment (Docker, CI/CD, monitoring)

---

## 🎨 Key Features

### Core Features (Must Have)
1. ✅ **Quick Authentication** - OAuth with Spotify, Google, Facebook
2. ✅ **Party Management** - Create, join, configure parties
3. ✅ **Queue Management** - Add/remove tracks with validation
4. ✅ **Democratic Voting** - Vote to reorder queue
5. ✅ **Spotify Search** - Search tracks and parse URLs
6. ✅ **Playback Control** - Play/pause/skip with device selection
7. ✅ **Real-Time Sync** - Queue and playback updates via WebSocket
8. ✅ **Playlist Management** - Sync queue with Spotify playlist
9. ✅ **State Machine** - Automatic track progression
10. ✅ **Token Refresh** - Automatic Spotify token management

### Future Features (Post-Launch)
- User profiles and listening history
- Party analytics and statistics
- Advanced queue management (filters, blocking)
- AI-powered recommendations
- Subscription tiers and payment
- Mobile apps (React Native)
- Admin dashboard

---

## 🔒 Security Checklist

- [ ] Use secure OAuth 2.0 flows
- [ ] Store tokens encrypted at rest
- [ ] Implement rate limiting on all endpoints
- [ ] Validate all inputs with Zod schemas
- [ ] Use parameterized queries (Drizzle ORM)
- [ ] CSRF protection for sensitive operations
- [ ] HTTPS in production (TLS 1.3)
- [ ] Secure session cookies (httpOnly, secure, sameSite)
- [ ] JWT with short expiry + refresh tokens
- [ ] Authenticate WebSocket connections
- [ ] Environment variables for all secrets
- [ ] Audit logging for sensitive operations

---

## 🧪 Testing Strategy

### Unit Tests (Bun Test)
- API endpoint handlers
- Business logic (queue ordering, voting)
- Database queries
- Spotify service methods
- Target: 80%+ coverage

### Integration Tests (Bun Test)
- API endpoint flows
- Database operations
- Socket.io events
- Spotify API integration (mocked)

### E2E Tests (Playwright)
- User login flow
- Create and join party
- Add track to queue
- Vote on track
- Host controls playback
- Real-time updates across clients

### Why Bun Test?
- **Jest-compatible:** Easy to learn if you know Jest
- **Fast:** Concurrent execution, built-in transpiler
- **No config:** Works with TypeScript/JSX out-of-the-box
- **Built-in:** No extra dependencies needed
- **Coverage:** `bun test --coverage`
- **Watch mode:** `bun test --watch`

---

## 📊 Success Metrics

### Technical
- API response time p95 < 200ms
- Real-time update latency < 100ms
- 99.9% uptime
- Zero critical security vulnerabilities
- 80%+ test coverage

### User Experience
- Login completion rate > 90%
- Track add success rate > 95%
- Average session duration > 30 minutes
- Vote engagement rate > 50%
- Mobile usability score > 80

### Business
- Support 10+ concurrent parties
- Average party size > 5 users
- User retention rate > 60%

---

## 🐛 Common Pitfalls to Avoid

❌ **Don't** sort queue in application code (use SQL ORDER BY)  
❌ **Don't** broadcast events before database commits  
❌ **Don't** skip database transactions for queue operations  
❌ **Don't** allow users to vote on their own tracks  
❌ **Don't** forget to refresh Spotify tokens automatically  
❌ **Don't** allow currently playing track to be removed  
❌ **Don't** store secrets in code or logs  

✅ **Do** use transactions for all queue operations  
✅ **Do** validate inputs with Zod schemas  
✅ **Do** write tests for critical paths  
✅ **Do** handle errors gracefully  
✅ **Do** log important events  
✅ **Do** keep code simple and readable  

---

## 🤝 Contributing

When implementing the rewrite:

1. Follow the [ROADMAP.md](./ROADMAP.md) phase by phase
2. Preserve critical patterns from [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
3. Write tests as you implement features
4. Keep documentation updated
5. Commit frequently with clear messages

---

## 📞 Resources

### Documentation
- All docs in this directory
- Original README.md for reference

### External APIs
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/)

### Libraries
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [React](https://react.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Socket.io](https://socket.io/)
- [Bun](https://bun.sh/)

---

## 📝 License

See original LICENSE file.

---

## 🎵 Let's Build Snoppify 2.0!

This documentation provides everything needed to build a modern, scalable, production-ready version of Snoppify while preserving all the features that make it great.

**Start with [QUICK_START.md](./QUICK_START.md) and follow the roadmap!**

Good luck! 🚀
