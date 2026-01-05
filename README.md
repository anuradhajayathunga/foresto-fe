# SmartRestaurant AI — Frontend

A modern, responsive web frontend for the **SmartRestaurant AI System**, built with **Next.js** (App Router). It provides intuitive dashboards and workflows for restaurant operations, including sales tracking, purchasing, inventory management, demand forecasting, and analytics.

The application securely communicates with the backend API for authentication, data fetching, and triggering AI-powered operations.

[![Vercel Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<YOUR_FRONTEND_REPO_LINK>)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Testing & Code Quality](#testing--code-quality)
- [Deployment](#deployment)
- [Branching Strategy & Contribution](#branching-strategy--contribution)
- [Related Projects](#related-projects)
- [License](#license)

---

## Features

- Secure user authentication (login/logout)
- Comprehensive dashboards with real-time KPIs (sales, inventory, purchases, forecasts)
- CRUD operations for core entities (products, suppliers, purchase orders, etc.)
- Forecasting interface to trigger model training and view predictions
- Responsive design optimized for desktop and tablet
- Modular, reusable components for maintainability

> Update this list as new features are implemented.

---

## Tech Stack

- **Framework**: Next.js 15+ (App Router, Server Components, React Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (or your chosen library)
- **HTTP Client**: Axios / native fetch
- **Forms & Validation**: React Hook Form + Zod
- **Charts**: Chart.js / Recharts
- **State Management**: React Context / Zustand / TanStack Query (as needed)
- **Authentication**: JWT (or session-based, matching backend)

---

## Architecture

### System Overview

```mermaid
flowchart LR
    U[Users / Evaluators] -->|Browser| FE[Frontend: Next.js App]
    FE -->|HTTPS REST/JSON| BE[Backend: Django / DRF API]
    BE --> DB[(Database: PostgreSQL/MySQL)]
    BE --> R[(Redis / Queue)]
    BE --> ML[Forecasting / ML Service]
    ML --> DB
````

### Frontend Internal Flow

```mermaid
flowchart TB
    Pages[Routes / Pages] --> Layouts[Layouts]
    Pages --> Features[Feature Modules]
    Features --> UI[Reusable UI Components]
    Features --> API[API Client Layer]
    API -->|fetch/axios| Backend[(Backend API)]
    Features --> State[State Management]
```

