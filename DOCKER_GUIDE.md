# Docker Setup Guide for Stock Express

## 📦 Docker Files Created

1. **Dockerfile** - Production-optimized build
2. **Dockerfile.dev** - Development build with hot reload
3. **docker-compose.yml** - Production services (app + MongoDB)
4. **docker-compose.dev.yml** - Development services (app + MongoDB + Mongo Express)
5. **.dockerignore** - Files to exclude from Docker image

---

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Environment variables set in `.env` file

### 1. Create `.env` file
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
```env
FINNHUB_API_KEY=your_key
GEMINI_API_KEY=your_key
NODEMAILER_EMAIL=your_email
NODEMAILER_PASSWORD=your_password
BETTER_AUTH_SECRET=your_secret
```

---

## 💻 Development

### Run with Hot Reload

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# The app will be available at http://localhost:3000
# MongoDB at localhost:27017
# Mongo Express GUI at http://localhost:8081 (admin/pass)
```

### Stop Development Environment

```bash
docker-compose -f docker-compose.dev.yml down

# With volume cleanup
docker-compose -f docker-compose.dev.yml down -v
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f mongodb
```

---

## 🏭 Production

### Build Production Image

```bash
# Build the image
docker build -t stock-express:latest .

# Tag for registry (e.g., Docker Hub)
docker tag stock-express:latest username/stock-express:latest
```

### Run Production

```bash
# Start with docker-compose
docker-compose up -d

# The app will be available at http://localhost:3000
```

### Stop Production

```bash
docker-compose down

# With volume cleanup
docker-compose down -v
```

---

## 🐳 Docker Commands Reference

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi stock-express:latest

# View image layers
docker history stock-express:latest
```

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View container logs
docker logs <container_id>
docker logs -f <container_id>  # Follow logs

# Execute command in container
docker exec -it <container_id> sh

# Inspect container
docker inspect <container_id>
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect stock_express_mongodb_data

# Remove volume
docker volume rm stock_express_mongodb_data
```

---

## 🔧 Docker Compose Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f

# Execute command
docker-compose exec app npm test

# Remove volumes
docker-compose down -v
```

---

## 🌐 Accessing Services

### Development

| Service | URL | Credentials |
|---------|-----|-------------|
| Stock Express App | http://localhost:3000 | - |
| MongoDB | localhost:27017 | - |
| Mongo Express | http://localhost:8081 | admin / pass |

### Production

| Service | URL |
|---------|-----|
| Stock Express App | http://localhost:3000 |
| MongoDB | localhost:27017 (internal only) |

---

## 📊 Dockerfile Details

### Production Dockerfile (Multi-stage)

**Stage 1: Builder**
- Installs all dependencies (dev + prod)
- Builds the Next.js application
- Creates optimized `.next` folder

**Stage 2: Runtime**
- Uses lightweight alpine image
- Copies only built artifacts
- Installs production dependencies only
- Runs as non-root user (nextjs)
- Includes health check
- ~300MB final image size

### Benefits
✅ Minimal image size (dev dependencies excluded)  
✅ Security (non-root user)  
✅ Health checks for orchestration  
✅ Proper signal handling (dumb-init)  

---

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in docker-compose
# Change ports: "3001:3000"
```

### MongoDB Connection Fails

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Verify MongoDB is healthy
docker-compose ps
```

### Permission Denied

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### App Container Crashes

```bash
# Check logs
docker-compose logs app

# Check env variables
docker-compose exec app printenv | grep MONGODB

# Rebuild image
docker-compose down
docker-compose up --build
```

### Out of Disk Space

```bash
# Clean up unused images
docker image prune -a

# Clean up unused volumes
docker volume prune

# Clean up everything
docker system prune -a
```

---

## 🔒 Security Best Practices

### 1. Use `.env` file (not in git)
```bash
echo ".env" >> .gitignore
```

### 2. Don't expose sensitive ports
In production, only expose port 3000, not MongoDB (27017)

### 3. Use secrets management
For production, use Docker secrets or environment variable managers:
- AWS Secrets Manager
- HashiCorp Vault
- Docker Swarm Secrets

### 4. Scan images for vulnerabilities
```bash
# Using Trivy
trivy image stock-express:latest
```

### 5. Non-root user
Already implemented in Dockerfile (nextjs:1001)

---

## 📈 Deployment to Cloud

### Docker Hub

```bash
# Login
docker login

# Tag image
docker tag stock-express:latest username/stock-express:latest

# Push
docker push username/stock-express:latest
```

### Vercel (Recommended for Next.js)
- Connect GitHub repository
- Vercel auto-deploys on push
- No Docker needed

### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name stock-express

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag stock-express:latest <account>.dkr.ecr.us-east-1.amazonaws.com/stock-express:latest

# Push
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/stock-express:latest
```

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Heroku (Legacy)

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create stock-express

# Push
git push heroku main
```

---

## 📚 Docker Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/gettingstarted/)
- [Next.js with Docker](https://nextjs.org/docs/deployment/docker)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## ✅ Docker Checklist

- [ ] Install Docker and Docker Compose
- [ ] Create `.env` file with all variables
- [ ] Build development image: `docker-compose -f docker-compose.dev.yml build`
- [ ] Start development: `docker-compose -f docker-compose.dev.yml up`
- [ ] Verify app at http://localhost:3000
- [ ] Test MongoDB connection
- [ ] Stop containers: `docker-compose down`
- [ ] Build production image: `docker build -t stock-express:latest .`
- [ ] Tag for registry if needed
- [ ] Document deployment steps

---

**Docker setup complete! Your Stock Express app is ready to containerize.** 🐳
