# Nasradin - Self-Hosted Deployment Guide

## 🚀 Deploying to Coolify on Hostinger VPS

This guide will help you deploy the Nasradin application to your Hostinger VPS using Coolify.

### Prerequisites

1. **Hostinger VPS** with:
   - Minimum 2GB RAM
   - Ubuntu 20.04 or later
   - Docker installed
   - Coolify installed

2. **Domain** (optional but recommended):
   - Point your domain to your VPS IP
   - Configure DNS A records

### Step 1: Install Coolify on Your VPS

SSH into your Hostinger VPS and run:

```bash
wget -q https://get.coollabs.io/coolify/install.sh -O install.sh; sudo bash ./install.sh
```

After installation, access Coolify at `http://your-vps-ip:8000`

### Step 2: Setup PostgreSQL Database

1. In Coolify, go to **Resources** → **Databases**
2. Click **+ New Database** → Select **PostgreSQL**
3. Configure:
   - Name: `nasradin-db`
   - Version: `15`
   - Create a strong password
4. Click **Deploy**

### Step 3: Deploy the Backend API

1. In Coolify, go to **Resources** → **Applications**
2. Click **+ New Application** → **GitHub Repository**
3. Connect your repository: `https://github.com/4utre/nasradin`
4. Configure:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `backend/Dockerfile`
   - **Port**: 3000
   - **Base Directory**: `/backend`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://user:password@nasradin-db:5432/nasradin
   JWT_SECRET=<generate-a-strong-random-string>
   FRONTEND_URL=https://your-domain.com
   ```

6. Click **Deploy**

### Step 4: Run Database Migrations

After the API is deployed, run migrations:

1. In Coolify, go to your API application
2. Click **Terminal** or **Execute Command**
3. Run:
   ```bash
   npm run migrate
   ```

### Step 5: Deploy the Frontend

1. In Coolify, **+ New Application** → **GitHub Repository**
2. Configure:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `Dockerfile` (root)
   - **Port**: 80

3. Add Environment Variables:
   ```
   VITE_API_URL=https://api.your-domain.com/api
   ```

4. Click **Deploy**

### Step 6: Configure Domains

1. In Coolify, go to each application's settings
2. Add your domains:
   - Frontend: `your-domain.com`
   - Backend API: `api.your-domain.com`
3. Enable **HTTPS** (Coolify will auto-generate Let's Encrypt certificates)

### Step 7: Create Your First User

Access your API endpoint to create an admin user:

```bash
curl -X POST https://api.your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "your-secure-password",
    "role": "admin"
  }'
```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@postgres:5432/nasradin
JWT_SECRET=minimum-32-characters-long-secret-key
FRONTEND_URL=https://your-domain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://api.your-domain.com/api
```

## 📝 Using Docker Compose (Alternative)

If you prefer Docker Compose instead of Coolify:

1. Clone the repository on your VPS:
   ```bash
   git clone https://github.com/4utre/nasradin.git
   cd nasradin
   ```

2. Create `.env` file:
   ```bash
   cp .env.production.example .env
   # Edit .env with your values
   nano .env
   ```

3. Deploy:
   ```bash
   docker-compose up -d
   ```

4. Run migrations:
   ```bash
   docker-compose exec api npm run migrate
   ```

## 🔒 Security Checklist

- [ ] Change default database password
- [ ] Generate strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW)
- [ ] Set up regular database backups
- [ ] Keep Docker images updated
- [ ] Use environment variables for secrets

## 📊 Monitoring

Access logs in Coolify:
- Go to your application
- Click on **Logs** tab
- Monitor real-time logs

## 🔄 Updates

To update your deployment:

1. Push changes to GitHub
2. In Coolify, go to your application
3. Click **Redeploy**

Or set up **Automatic Deployment** in Coolify settings.

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs nasradin-db
```

### API Not Starting
```bash
# Check API logs
docker logs nasradin-api

# Verify environment variables
docker exec nasradin-api env
```

### Frontend Can't Connect to API
- Verify CORS settings in backend
- Check `VITE_API_URL` in frontend env
- Ensure API domain is accessible

## 📞 Support

For issues, create an issue on GitHub: https://github.com/4utre/nasradin/issues
