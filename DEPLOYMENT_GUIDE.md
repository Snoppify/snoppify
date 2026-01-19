# Snoppify Deployment Guide

This guide covers three deployment options for Snoppify, from completely free (self-hosted at home) to fully managed cloud services.

---

## Deployment Options Overview

| Option | Infrastructure | Cost/Month | Best For |
|--------|---------------|------------|----------|
| **Home Server** | Docker on existing hardware | $0 | Personal use, local parties |
| **Raspberry Pi** | Docker on RPi 4 (8GB) | $0 (after hardware) | Home setup, low traffic |
| **Hetzner VPS** | CX11 (2GB RAM) | €3.79 (~$4) | Budget self-hosting |
| **DigitalOcean** | Basic Droplet | $6/month | Simple VPS |
| **Railway Free** | Managed PaaS | $0 ($5 credit/month) | MVP testing |
| **Vercel + Railway** | Managed PaaS | ~$25-30/month | Production, no DevOps |
| **AWS/GCP** | Cloud VM | $10-50/month | Enterprise scale |

---

## Option 1: Free Cloud (Vercel + Railway Free Tier)

Perfect for testing and small-scale deployments using free tiers.

### Services Used

**Frontend: Vercel Free Tier**
- 100GB bandwidth/month
- Automatic HTTPS
- Global CDN
- Git integration (auto-deploy on push)
- Free forever for hobby projects

**Backend: Railway Free Tier**
- $5 credit/month (enough for hobby projects)
- PostgreSQL included
- Redis included
- Automatic deployments
- No credit card required to start

**Alternative Database: Supabase Free Tier**
- 500MB PostgreSQL database
- 2GB bandwidth/month
- Automatic backups
- Real-time subscriptions

**Alternative Redis: Upstash Free Tier**
- 10,000 commands/day
- Global edge caching
- REST API

### Setup Steps

#### 1. Deploy Backend to Railway

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Initialize project
cd server
railway init

# Add PostgreSQL and Redis
railway add --postgres
railway add --redis

# Set environment variables
railway variables set SPOTIFY_CLIENT_ID=your_client_id
railway variables set SPOTIFY_CLIENT_SECRET=your_client_secret
railway variables set JWT_SECRET=your_secret

# Deploy
railway up
```

#### 2. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
cd web
vercel

# Follow prompts:
# - Link to your GitHub repo
# - Set build command: bun run build
# - Set output directory: dist
# - Add environment variable: VITE_API_URL=https://your-railway-app.up.railway.app
```

#### 3. Configure CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: cd server && bun install
      - run: cd server && bun test
      - uses: railwayapp/cli@v0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: cd web && bun install
      - run: cd web && bun run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Cost Analysis

**Free tier limits:**
- Vercel: 100GB bandwidth (plenty for small parties)
- Railway: $5 credit/month (covers ~100 hours uptime)
- **Total: $0/month** for hobby use

When you exceed free tier:
- Railway: ~$10-15/month for always-on backend
- Vercel: Still free (very generous limits)
- **Total: ~$10-15/month**

---

## Option 2: Self-Hosted VPS ($4-6/month)

Full control, always-on, fixed cost. Best value for persistent deployment.

### Recommended VPS Providers

**Budget Option: Hetzner Cloud (~$4/month)**
- CX11: 2GB RAM, 20GB SSD, 20TB traffic
- Data centers in EU/US
- Best price/performance ratio

**Popular Option: DigitalOcean ($6/month)**
- Basic Droplet: 1GB RAM, 25GB SSD
- More tutorials/community support
- $200 free credit for new users

**Others:**
- Linode: $5/month (1GB RAM)
- Vultr: $6/month (1GB RAM)
- Contabo: €3.99/month (4GB RAM) - Europe only

### Prerequisites

- A VPS with Ubuntu 22.04 LTS
- A domain name (optional but recommended)
- SSH access to your server

### Quick Setup

#### 1. Initial Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose -y

# Create non-root user (recommended)
adduser snoppify
usermod -aG docker snoppify
su - snoppify
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/yourusername/snoppify.git
cd snoppify

# Create production environment file
cp .env.example .env.prod

# Edit configuration
nano .env.prod
```

**.env.prod example:**
```env
# Database
DATABASE_URL=postgresql://snoppify:password@postgres:5432/snoppify
REDIS_URL=redis://redis:6379

# Server
PORT=3000
NODE_ENV=production
SERVER_URL=https://snoppify.yourdomain.com
CLIENT_URL=https://snoppify.yourdomain.com

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_client_id
FACEBOOK_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET=your_very_secret_key_change_this
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
```

#### 3. Configure Domain (Optional)

If using a domain, point your DNS A record to your VPS IP:

```
Type: A
Name: @
Value: your-vps-ip
TTL: 3600
```

For subdomain:
```
Type: A
Name: snoppify
Value: your-vps-ip
TTL: 3600
```

#### 4. Deploy with Docker Compose

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps
```

#### 5. Configure Caddyfile

Edit `Caddyfile`:

```caddy
# With domain (automatic HTTPS)
snoppify.yourdomain.com {
    reverse_proxy web:3000
    reverse_proxy /api/* server:3000
    reverse_proxy /socket.io/* server:3000
}

# Without domain (HTTP only, use IP)
:80 {
    reverse_proxy web:3000
    reverse_proxy /api/* server:3000
    reverse_proxy /socket.io/* server:3000
}
```

Caddy automatically:
- Obtains SSL certificates from Let's Encrypt
- Renews certificates before expiry
- Redirects HTTP to HTTPS
- Sets security headers

#### 6. Verify Deployment

```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# Test the application
curl https://snoppify.yourdomain.com/api/health

# Or without domain:
curl http://your-vps-ip/api/health
```

### Maintenance

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f server

# Update application
cd snoppify
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U snoppify snoppify > backup.sql

# Restore database
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U snoppify snoppify

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Remove everything (including data)
docker compose -f docker-compose.prod.yml down -v
```

### Monitoring

Add to `docker-compose.prod.yml` (optional):

```yaml
  # Uptime monitoring
  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma:/app/data
    restart: unless-stopped
```

Access at `http://your-vps-ip:3001` to set up monitoring.

---

## Option 3: Self-Hosted at Home ($0/month)

Deploy on existing hardware at home. Zero cost, full control.

### Hardware Options

**Option A: Existing Computer**
- Any computer with 4GB+ RAM
- Windows/Mac/Linux
- Install Docker Desktop

**Option B: Raspberry Pi 4**
- 8GB RAM model recommended
- MicroSD card (64GB+ recommended)
- Raspbian OS Lite

**Option C: Mini PC / Old Laptop**
- Intel NUC, Lenovo ThinkCentre, etc.
- Silent, low power consumption
- Perfect for 24/7 operation

### Prerequisites

- Computer/Pi connected to your home network
- Docker installed
- Static IP on local network (set in router)
- (Optional) Tailscale for remote access

### Setup Steps

#### 1. Install Docker

**On Ubuntu/Debian/Raspbian:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**On Windows:**
- Download Docker Desktop from docker.com
- Install and restart

**On macOS:**
- Download Docker Desktop from docker.com
- Install and start Docker

#### 2. Set Static Local IP

In your router's DHCP settings, assign a static IP to your server:
- Example: `192.168.1.100`
- This prevents the IP from changing

#### 3. Clone and Deploy

```bash
# Clone repository
git clone https://github.com/yourusername/snoppify.git
cd snoppify

# Create local environment
cp .env.example .env.prod
nano .env.prod  # Configure for local network

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

#### 4. Access Locally

Your app is now accessible at:
- `http://192.168.1.100` (or your static IP)
- From any device on your home network

**For parties:** Share the local IP with guests who are on your WiFi.

#### 5. Remote Access with Tailscale (Optional)

Access your home server securely from anywhere using Tailscale (free for personal use).

**Install Tailscale:**

```bash
# On Ubuntu/Debian
curl -fsSL https://tailscale.com/install.sh | sh

# On Raspberry Pi
curl -fsSL https://pkgs.tailscale.com/stable/raspbian/bullseye.gpg | sudo apt-key add -
curl -fsSL https://pkgs.tailscale.com/stable/raspbian/bullseye.list | sudo tee /etc/apt/sources.list.d/tailscale.list
sudo apt update && sudo apt install tailscale

# Start Tailscale
sudo tailscale up
```

**Access from anywhere:**
- Install Tailscale on your phone/laptop
- Connect to your Tailnet
- Access your server at its Tailscale IP (e.g., `100.64.0.1`)
- No port forwarding needed!
- Encrypted connection
- Works through any firewall/NAT

**Configure Caddyfile for Tailscale:**

```caddy
:80 {
    reverse_proxy web:3000
    reverse_proxy /api/* server:3000
    reverse_proxy /socket.io/* server:3000
}
```

Now accessible at `http://tailscale-ip` from anywhere!

### Power Consumption

**Raspberry Pi 4:**
- Idle: ~3W
- Load: ~6W
- Cost: ~$1.50/month (at $0.12/kWh)

**Mini PC:**
- Idle: ~10W
- Load: ~25W
- Cost: ~$2-5/month

**Old Laptop:**
- Idle: ~15W
- Load: ~30W
- Cost: ~$3-6/month

### Advantages

✅ Zero recurring costs  
✅ Full data control (no third-party servers)  
✅ No bandwidth limits  
✅ Perfect for home parties  
✅ Learn Docker/DevOps  
✅ Can access remotely with Tailscale  

### Disadvantages

❌ Requires hardware  
❌ Your internet upload speed matters for remote guests  
❌ Power outages affect availability  
❌ Need basic technical skills  
❌ Not suitable for public/commercial use  

---

## Docker Compose Production File

**docker-compose.prod.yml:**

```yaml
version: '3.8'

services:
  web:
    build:
      context: ./web
      dockerfile: ../Dockerfile.web
    restart: unless-stopped
    environment:
      - VITE_API_URL=http://server:3000
    depends_on:
      - server

  server:
    build:
      context: ./server
      dockerfile: ../Dockerfile.server
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://snoppify:${POSTGRES_PASSWORD}@postgres:5432/snoppify
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env.prod
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: snoppify
      POSTGRES_USER: snoppify
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U snoppify"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
      - server

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  caddy_config:
```

---

## Dockerfiles

**Dockerfile.web:**

```dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Production image
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

**Dockerfile.server:**

```dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Run migrations (if needed)
# RUN bun run db:migrate

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

---

## Comparison Summary

### When to Use Each Option

**Free Cloud (Vercel + Railway):**
- ✅ Testing and MVP
- ✅ Don't want to manage servers
- ✅ Need global CDN
- ❌ Long-term cost can add up
- ❌ Limited control

**VPS Hosting ($4-6/month):**
- ✅ Predictable monthly cost
- ✅ Full control
- ✅ Professional deployment
- ✅ Always online
- ❌ Requires basic DevOps knowledge
- ❌ Monthly recurring cost

**Home Server ($0/month):**
- ✅ Zero recurring costs
- ✅ Perfect for local parties
- ✅ Full data privacy
- ✅ Learning opportunity
- ❌ Depends on your internet/power
- ❌ Not for production apps
- ❌ Requires hardware

### Recommendation

**For learning/testing:** Start with free cloud  
**For small production:** Self-hosted VPS  
**For home parties only:** Self-hosted at home  
**For scale/growth:** Managed cloud (Railway/Vercel paid)  

---

## Troubleshooting

### Common Issues

**Issue: Cannot connect to database**
```bash
# Check if postgres is running
docker compose ps

# Check logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d
```

**Issue: Port already in use**
```bash
# Find process using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Kill process or change Caddy ports in docker-compose.yml
```

**Issue: SSL certificate not working**
```bash
# Check Caddy logs
docker compose logs caddy

# Ensure:
# 1. DNS points to your server
# 2. Ports 80 and 443 are accessible
# 3. Domain is correct in Caddyfile
```

**Issue: Out of memory**
```bash
# Check memory usage
docker stats

# Add swap (on Linux)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Getting Help

- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share setups
- Discord: Real-time community support (if available)

---

## Next Steps

After deployment:

1. **Test all features** - Authentication, queue, voting, playback
2. **Set up backups** - Automate database backups
3. **Monitor uptime** - Use Uptime Kuma or similar
4. **Secure your server** - Configure firewall, use strong passwords
5. **Update regularly** - Keep Docker images and app updated

Congratulations on deploying Snoppify! 🎉🎵
