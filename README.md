# Foresto | Modern and Elegant Restaurant  Experience  — Fullstack (Django + Next.js)

A robust, scalable restaurant management platform powered by a **Django REST Framework** backend and a modern **Next.js** frontend. Supports workflows for **sales**, **purchasing**, **inventory**, **suppliers**, and **AI-powered demand forecasting**.

This monorepo provides a seamless development, deployment, and collaboration experience for both the backend API (**foresto-be**) and the frontend web app (**foresto-fe**).


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
     │   ├── .env.example
     │   └── ...
     ├── frontend/               # Next.js web app
     │   ├── public/
     │   ├── src/
     │   ├── package.json
     │   ├── .env.example
     │   └── ...
     ├── docker-compose.yml      # For fullstack local/dev/production
     ├── .github/                # CI/CD workflows
     │    └── workflows/
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
cd foresto
```
## Environment Variables
- Copy and configure the provided `.env.example` files in both the backend and frontend folders.
- Never commit your real secrets!
- 
## Backend (backend/.env)
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
## Frontend (frontend/.env.local)
``` env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Backend Setup (Django)

``` bash
cd backend
python -m venv env
source env/bin/activate       # (Windows: env\Scripts\activate)
pip install -r requirements.txt
cp .env.example .env
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


### Frontend Setup (Next.js)
```bash
cd frontend
npm install       # or yarn install
cp .env.example .env.local
npm run dev       # or yarn dev
```
> Open [`http://localhost:3000`](http://localhost:3000) in your browser.

### Running the Fullstack with Docker (Optional)
If you have Docker installed, use the included docker-compose.yml for easy fullstack local dev:

```bash
docker-compose up --build
```
Frontend: [`http://localhost:3000`](http://localhost:3000) 
Backend: [`http://127.0.0.1:8000/`](http://127.0.0.1:8000/)


## Project Structure
## 📂 Project Structure

### Backend (`backend/`)

See [backend/README.md](backend/README.md) for detailed documentation.

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

See [frontend/README.md](frontend/README.md) for detailed documentation.

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
