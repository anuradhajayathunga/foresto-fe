# Foresto | Modern and Elegant Restaurant  Experience  — Fullstack (Django + Next.js)

A robust, scalable restaurant management platform powered by a **Django REST Framework** backend and a modern **Next.js** frontend. Supports workflows for **sales**, **purchasing**, **inventory**, **suppliers**, and **AI-powered demand forecasting**.

The application securely communicates with the backend API for authentication, data fetching, and triggering AI-powered operations.

[![Vercel Deploy](https://vercel.com/button)](https://foresto-two.vercel.app/login)


## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Clone the Repository](#clone-the-repository)
    - [Environment Variables](#environment-variables)
    - [Backend Setup (Django)](#backend-setup-django)
    - [Frontend Setup (Nextjs)](#frontend-setup-nextjs)
    - [Running the Fullstack with Docker (Optional)](#running-the-fullstack-with-docker-optional)
- [Project Structure](#project-structure)
- [API & Integration](#api--integration)
    - [Authentication](#authentication)
    - [Forecasting & Background Jobs](#forecasting--background-jobs)
- [Testing & Quality](#testing--quality)
- [Deployment](#deployment)
- [Version Control & Collaboration](#version-control--collaboration)
- [Contributing](#contributing)
- [Related Repositories](#related-repositories)
- [License](#license)
- [Maintainers & Support](#maintainers--support)


## Project Overview

**Foresto | SmartRestaurant AI System** is a fullstack solution that enables restaurants to:

- Manage daily operations: inventory, suppliers, purchases, and sales
- Perform demand forecasting using AI/ML
- Access analytics dashboards and reports
- Collaborate in a secure, role-based system



## Architecture

```mermaid
flowchart LR
    U[Users / Staff] -->|Browser/App| FE[Frontend: Next.js]
    FE -->|REST/JSON API| BE[Backend: Django / DRF]
    BE --> DB[(PostgreSQL)]
    BE --> R[(Redis — for background tasks)]
    BE --> ML[Forecasting/ML Module]
    ML --> DB
````


## Monorepo Structure
``` bash
foresto/
├──  web/
     ├── backend/                # Django REST API & services
     │   ├── manage.py
     │   ├── config/
     │   ├── apps/
     │   ├── requirements.txt
     │   ├── requirements-azure.txt  # Extra production deps (gunicorn, whitenoise)
     │   ├── Dockerfile          # Container image for Azure App Service
     │   ├── startup.sh          # Azure App Service startup script (non-Docker)
     │   ├── .env.example
     │   ├── .env.azure.example  # Azure-specific env vars reference
     │   └── ...
     ├── frontend/               # Next.js web app
     │   ├── public/
     │   ├── src/
     │   ├── Dockerfile          # Container image for Azure App Service
     │   ├── package.json
     │   ├── .env.example
     │   └── ...
     ├── docker-compose.yml      # For fullstack local/dev/production
     ├── .github/                # CI/CD workflows
     │    └── workflows/
     │         ├── deploy-backend-azure.yml   # Deploy backend to Azure App Service
     │         └── deploy-frontend-azure.yml  # Deploy frontend to Azure Static Web Apps
     ├── README.md               # (You are here)
     └── LICENSE
```

## Tech Stack
- Backend: Django, Django REST Framework, PostgreSQL, Celery & Redis (optional)
- Frontend: Next.js (TypeScript), Tailwind CSS, React, Shadcn/ui
- Auth: JWT (djangorestframework-simplejwt)
- API Communication: REST/JSON via Axios or fetch
- DevOps: Docker, GitHub Actions, Vercel
- Testing/Quality: Pytest, ESLint, Prettier, TypeScript, ruff/flake8

## Key Features
- Modern web dashboard (React + Next.js)
- RESTful API for all operations (Django + DRF)
- Secure Authentication (JWT-based)
- Role-based access and permission patterns
- Sales, purchases, suppliers, inventory management (CRUD)
- Demand Forecasting (train, predict, historical data)
- Responsive UI, real-time updates
- CI/CD with automated testing, linting, and deploys

## Getting Started
- Python 3.10+
- Node.js v18+
- PostgreSQL 14+
- npm or yarn
- Docker & Docker Compose (for optional unified local dev)

## Clone the Repository
``` bash
git clone https://github.com/anuradhajayathunga/foresto.git
cd web
```
## Environment Variables
   - Copy and configure the provided `.env.example` files in both the backend and frontend folders.

## Backend Setup (Django)

``` bash
cd backend
python -m venv .venv
source .venv/bin/activate       # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
cp .env.example .env
```

### Backend (web/backend/.env)
``` env
DJANGO_SECRET_KEY=your-secret
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=foresto_db
DB_USER=foresto_user
DB_PASSWORD=foresto_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000
JWT_ACCESS_LIFETIME_MIN=15
JWT_REFRESH_LIFETIME_DAYS=7
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```



### Database setup (psql shell):

```SQL
CREATE DATABASE foresto_db;
CREATE USER foresto_user WITH PASSWORD 'foresto_password';
GRANT ALL PRIVILEGES ON DATABASE foresto_db TO foresto_user;
```


### Run migrations & start server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
> Open API usually available at: [`http://127.0.0.1:8000/`](http://127.0.0.1:8000/)


## Frontend Setup (Next.js)

```bash
cd frontend
npm install       # or yarn install
cp .env.example .env.local
npm run dev       # or yarn dev
```
> Open [`http://localhost:3000`](http://localhost:3000) in your browser.


### Frontend (web/frontend/.env.local)
``` env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```


### Running the Fullstack with Docker (Optional)
If you have Docker installed, use the included docker-compose.yml for easy fullstack local dev:

```bash
docker-compose up --build
```

   - Frontend: [`http://localhost:3000`](http://localhost:3000) 
   - Backend: [`http://127.0.0.1:8000/`](http://127.0.0.1:8000/)


## Project Structure
## 📂 Project Structure

### Backend (`backend/`)

See [`web/backend/README.md`](web/backend/README.md) for detailed documentation.

```
backend/
├── config/           # Django settings, urls, wsgi, asgi
├── apps/
│   ├── authentication/
│   ├── suppliers/
│   ├── purchases/
│   ├── inventory/
│   ├── sales/
│   ├── forecasting/
│   └── analytics/
├── requirements.txt
└── manage.py
```

### Frontend (`frontend/`)

See [`web/frontend/README.md`](web/frontend/README.md) for detailed documentation.

```
frontend/
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # React components
│   ├── lib/          # API clients, utilities
│   └── types/        # TypeScript types
├── public/           # Static assets
└── package.json
```



## 💻 Development

### Environment Variables

**Backend** (`backend/.env`):
```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DATABASE_URL=postgresql://foresto_user:foresto_password@localhost:5432/foresto_db
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### Available Commands

**Backend:**
```bash
cd backend
python manage.py makemigrations    # Create migrations
python manage.py migrate           # Apply migrations
python manage.py createsuperuser   # Create admin user
python manage.py runserver         # Run dev server
python manage.py test              # Run tests
```

**Frontend:**
```bash
cd frontend
npm run dev                        # Development server
npm run build                      # Production build
npm run lint                       # Run linter
npm run test                       # Run tests
```



## ✅ Testing & Quality

**Backend:**
```bash
cd backend
python manage.py test
flake8 .
black --check .
```

**Frontend:**
```bash
cd frontend
npm run lint
npm run type-check
npm run test
```



## 🚢 Deployment

### 🔵 Azure (Recommended – Full Setup)

#### Prerequisites

| Tool | Purpose |
|------|---------|
| [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) | Manage Azure resources |
| [Docker Desktop](https://docs.docker.com/get-docker/) | Build container images |
| An [Azure account](https://azure.microsoft.com/free/) | Cloud platform |

---

#### Architecture on Azure

```
GitHub Actions
├── deploy-backend-azure.yml  → Azure App Service  (Django + Gunicorn)
│                                └── Azure Container Registry (Docker image)
│                                └── Azure Database for PostgreSQL
└── deploy-frontend-azure.yml → Azure Static Web Apps  (Next.js SSR/SSG)
```

---

#### Step 1 – Create Azure Resources

```bash
# Log in
az login

# Set variables
RG=foresto-rg
LOCATION=eastus
ACR_NAME=forestoacr          # must be globally unique
BACKEND_APP=foresto-backend  # must be globally unique
DB_SERVER=foresto-db         # must be globally unique

# Resource group
az group create --name $RG --location $LOCATION

# Azure Container Registry
az acr create --resource-group $RG --name $ACR_NAME --sku Basic --admin-enabled true

# App Service Plan (Linux, B1 tier – free trial eligible)
az appservice plan create --name foresto-plan --resource-group $RG \
  --is-linux --sku B1

# Backend Web App (Docker container)
az webapp create --resource-group $RG --plan foresto-plan \
  --name $BACKEND_APP \
  --deployment-container-image-name "${ACR_NAME}.azurecr.io/foresto-backend:latest"

# Azure Database for PostgreSQL – Flexible Server
az postgres flexible-server create \
  --resource-group $RG \
  --name $DB_SERVER \
  --admin-user foresto_user \
  --admin-password "YourStrongPassword!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --database-name foresto_db \
  --public-access 0.0.0.0

# Allow App Service to reach the database
az postgres flexible-server firewall-rule create \
  --resource-group $RG --name $DB_SERVER \
  --rule-name allow-azure-services \
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

# Azure Static Web Apps (Frontend – Next.js)
az staticwebapp create \
  --name foresto-frontend \
  --resource-group $RG \
  --source https://github.com/<your-org>/foresto \
  --branch main \
  --app-location "web/frontend" \
  --login-with-github
```

---

#### Step 2 – Configure GitHub Secrets & Variables

Go to **Settings → Secrets and variables → Actions** in your GitHub repository and add:

| Secret / Variable | Value |
|---|---|
| `AZURE_CREDENTIALS` | Output of `az ad sp create-for-rbac` (see below) |
| `ACR_USERNAME` | Output of `az acr credential show --name $ACR_NAME --query username -o tsv` |
| `ACR_PASSWORD` | Output of `az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from Azure Portal → Static Web App → Manage deployment token |
| `AZURE_BACKEND_APP_NAME` *(variable)* | `foresto-backend` |
| `AZURE_CONTAINER_REGISTRY` *(variable)* | `forestoacr.azurecr.io` |
| `AZURE_RESOURCE_GROUP` *(variable)* | `foresto-rg` |
| `NEXT_PUBLIC_API_BASE_URL` *(variable)* | `https://foresto-backend.azurewebsites.net` |

**Create service principal:**
```bash
az ad sp create-for-rbac \
  --name foresto-github-actions \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/$RG \
  --sdk-auth
```

---

#### Step 3 – Set Backend Environment Variables on Azure

```bash
az webapp config appsettings set \
  --resource-group $RG \
  --name $BACKEND_APP \
  --settings \
    SECRET_KEY="your-strong-secret-key" \
    DEBUG="0" \
    ALLOWED_HOSTS="${BACKEND_APP}.azurewebsites.net" \
    DATABASE_URL="postgresql://foresto_user:YourStrongPassword!@${DB_SERVER}.postgres.database.azure.com:5432/foresto_db?sslmode=require" \
    CORS_ALLOWED_ORIGINS="https://your-frontend.azurestaticapps.net" \
    CSRF_TRUSTED_ORIGINS="https://${BACKEND_APP}.azurewebsites.net" \
    WEBSITES_PORT="8000"
```

See [`web/backend/.env.azure.example`](web/backend/.env.azure.example) for the full list of supported variables.

---

#### Step 4 – Deploy

Push to the `main` branch or trigger the workflows manually from **Actions** tab:

```bash
git push origin main
```

- `deploy-backend-azure.yml` builds the Docker image, pushes to ACR, and deploys to Azure App Service.
- `deploy-frontend-azure.yml` deploys the Next.js app to Azure Static Web Apps (with automatic PR preview environments).

---

### 🐳 Docker (Local / Self-Hosted)

```bash
cd web
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

---

### Frontend (Vercel)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables: `NEXT_PUBLIC_API_BASE_URL`
4. Deploy automatically on push

### Backend (Heroku/AWS/DigitalOcean)

1. Set `DJANGO_DEBUG=False`
2. Configure `ALLOWED_HOSTS`
3. Use managed PostgreSQL
4. Deploy with Gunicorn + Nginx



## 🌳 Version Control & Collaboration

### Branching Strategy (Git Flow)

```
main          (Production)
  ↓
develop       (Integration)
  ↓
feature/*     (feature/user-auth)
bugfix/*      (bugfix/login-issue)
hotfix/*      (hotfix/critical-bug)
release/*     (release/v1.0.0)
```

### Pull Request Workflow

1. Create branch from `develop`
2. Make commits with clear messages
3. Push and create PR
4. Get at least 1 approval
5. Merge to `develop`

### Commit Message Format

```
feat(scope): add new feature
fix(scope): fix bug
docs: update documentation
test: add tests
```



## 🤝 Contributing

1. **Fork & Clone:**
   ```bash
   git clone https://github.com/anuradhajayathunga/foresto.git
   cd foresto
   ```

2. **Create Branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make Changes & Commit:**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push & Create PR:**
   ```bash
   git push origin feature/your-feature
   ```

5. **Wait for Review & Merge**



## 📄 License

Academic final year project at **Sri Lanka Institute of Information Technology**  
**License:** MIT



## 👥 Maintainers & Support

**Team:**
- [JAYATHUNGA A G I A](https://github.com/anuradhajayathunga)
- [THILAKARATHNAW P N S](https://github.com/NethumThilakarathna)
- [ALAWATHTHA K A](https://github.com/AlawaththaKA)
- [Fernando W G P N](https://github.com/PraveenNavodya)

**Contact:**
- 📧 Email: hi.foresto@gmail.com
- 🐛 [Report Issues](https://github.com/anuradhajayathunga/foresto/issues)
- 💬 [Discussions](https://github.com/anuradhajayathunga/foresto/discussions)



**Happy coding! Let's build something amazing together! 🚀**
