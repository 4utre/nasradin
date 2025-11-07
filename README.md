# Nasradin - Expense Management System# Base44 Preview Template for MicroVM sandbox



A full-stack expense management application with driver tracking, employee management, and comprehensive reporting features.This template is used by the server to preview user-apps.



## 🏗️ Architecture## user files

server creates the user-app files in the __components__, __pages__ folders

- **Frontend**: React + Vite + TailwindCSS + shadcn/ui

- **Backend**: Node.js + Express## server injected data

- **Database**: PostgreSQLserver injects app related data to __app.config.js__, which is used by App.jsx to render the components in the files.

- **Deployment**: Docker + Coolify (self-hosted)

## ✨ Features

- 📊 Driver expense tracking
- 👥 Employee management
- 💰 Expense categorization and reporting
- 📅 Calendar view for expenses
- 📈 Dashboard with analytics
- 🔐 JWT authentication
- 🎨 Modern UI with dark mode support
- 📱 Responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/4utre/nasradin.git
   cd nasradin
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate
   npm run dev
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd ..
   npm install
   cp .env.example .env.local
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Copy environment template
cp .env.production.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npm run migrate
```

## ☁️ Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Coolify on your Hostinger VPS.

## 📁 Project Structure

```
nasradin/
├── backend/              # Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── db/          # Database & migrations
│   │   └── middleware/  # Auth middleware
│   └── Dockerfile
├── src/                 # React frontend
│   ├── api/            # API client
│   ├── components/     # React components
│   ├── pages/          # Page components
│   └── lib/            # Utilities
└── docker-compose.yml
```

## 🔐 API Authentication

Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "email": "admin@example.com", "password": "securepassword", "role": "admin"}'
```

## 📝 License

MIT

---

**Note**: Migrated from base44 to fully self-hosted solution.
