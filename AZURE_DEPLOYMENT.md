# Deploying Foresto on Azure – Step-by-Step Guide

This document walks you through deploying the **Foresto** application to Microsoft Azure. The stack is:

| Layer | Technology | Azure Service |
|---|---|---|
| Frontend | Next.js (React / TypeScript) | Azure Static Web Apps |
| Backend | Django REST Framework | Azure App Service (Python) |
| Database | PostgreSQL | Azure Database for PostgreSQL – Flexible Server |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Provision Azure Resources](#2-provision-azure-resources)
   - 2.1 [Create a Resource Group](#21-create-a-resource-group)
   - 2.2 [Create Azure Database for PostgreSQL](#22-create-azure-database-for-postgresql-flexible-server)
   - 2.3 [Create Azure App Service for the Backend](#23-create-azure-app-service-for-the-backend)
   - 2.4 [Create Azure Static Web App for the Frontend](#24-create-azure-static-web-app-for-the-frontend)
3. [Configure the Backend (Django)](#3-configure-the-backend-django)
   - 3.1 [Set App Service Environment Variables](#31-set-app-service-environment-variables)
   - 3.2 [Configure Startup Command](#32-configure-startup-command)
4. [Configure the Frontend (Next.js)](#4-configure-the-frontend-nextjs)
5. [Set Up GitHub Actions (CI/CD)](#5-set-up-github-actions-cicd)
   - 5.1 [Backend workflow secrets](#51-backend-workflow-secrets)
   - 5.2 [Frontend workflow secrets](#52-frontend-workflow-secrets)
6. [First Deploy & Smoke Test](#6-first-deploy--smoke-test)
7. [Custom Domain & HTTPS (Optional)](#7-custom-domain--https-optional)
8. [Environment Variable Reference](#8-environment-variable-reference)
9. [Cost-Saving Tips](#9-cost-saving-tips)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before you begin, make sure you have the following installed and configured on your local machine:

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (`az`) – v2.50+
- [Git](https://git-scm.com/)
- A **Microsoft Azure account** with an active subscription
- A **GitHub** account with this repository forked or cloned

Log in to Azure from your terminal:

```bash
az login
```

---

## 2. Provision Azure Resources

All commands below use Bash/Azure CLI. Replace the placeholder values (in `< >`) with your own.

### 2.1 Create a Resource Group

A resource group is a logical container for all related Azure resources.

```bash
az group create \
  --name foresto-rg \
  --location eastus
```

> **Tip:** Choose the Azure region closest to your users (e.g., `southeastasia` for Sri Lanka).

---

### 2.2 Create Azure Database for PostgreSQL – Flexible Server

```bash
# Create the server
az postgres flexible-server create \
  --resource-group foresto-rg \
  --name foresto-db-server \
  --location eastus \
  --admin-user forestroadmin \
  --admin-password "<YourStrongPassword>" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --yes

# Create the application database
az postgres flexible-server db create \
  --resource-group foresto-rg \
  --server-name foresto-db-server \
  --database-name foresto_db

# Allow Azure services to connect (needed for App Service → DB)
az postgres flexible-server firewall-rule create \
  --resource-group foresto-rg \
  --name foresto-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

Save the full connection URL – you will need it in section 3:

```
postgresql://forestroadmin:<YourStrongPassword>@foresto-db-server.postgres.database.azure.com/foresto_db?sslmode=require
```

---

### 2.3 Create Azure App Service for the Backend

```bash
# Create an App Service Plan (B1 is the cheapest paid tier that supports custom startup commands)
az appservice plan create \
  --name foresto-backend-plan \
  --resource-group foresto-rg \
  --sku B1 \
  --is-linux

# Create the Web App with Python 3.12 runtime
az webapp create \
  --name foresto-backend \
  --resource-group foresto-rg \
  --plan foresto-backend-plan \
  --runtime "PYTHON:3.12"
```

Note the hostname that Azure assigns:
`https://foresto-backend.azurewebsites.net`

---

### 2.4 Create Azure Static Web App for the Frontend

```bash
az staticwebapp create \
  --name foresto-frontend \
  --resource-group foresto-rg \
  --location eastus2 \
  --source https://github.com/<your-github-username>/foresto \
  --branch main \
  --app-location "web/frontend" \
  --output-location ".next" \
  --login-with-github
```

> **Note:** The `--login-with-github` flag opens a browser window to authorise Azure to connect to your GitHub repository and automatically install the GitHub Actions workflow.

---

## 3. Configure the Backend (Django)

### 3.1 Set App Service Environment Variables

The Django settings file reads all configuration from environment variables. Set them in App Service configuration:

```bash
az webapp config appsettings set \
  --name foresto-backend \
  --resource-group foresto-rg \
  --settings \
    DEBUG="False" \
    SECRET_KEY="<generate-a-long-random-string>" \
    ALLOWED_HOSTS="foresto-backend.azurewebsites.net" \
    CORS_ALLOWED_ORIGINS="https://foresto-frontend.azurestaticapps.net" \
    CSRF_TRUSTED_ORIGINS="https://foresto-frontend.azurestaticapps.net" \
    DATABASE_URL="postgresql://forestroadmin:<YourStrongPassword>@foresto-db-server.postgres.database.azure.com/foresto_db?sslmode=require" \
    JWT_ACCESS_LIFETIME_MIN="15" \
    JWT_REFRESH_LIFETIME_DAYS="7" \
    WHATSAPP_ENABLED="false" \
    WHATSAPP_API_BASE="https://graph.facebook.com" \
    WHATSAPP_API_VERSION="v21.0" \
    WHATSAPP_PHONE_NUMBER_ID="<your_phone_number_id>" \
    WHATSAPP_ACCESS_TOKEN="<your_access_token>" \
    WHATSAPP_DEFAULT_COUNTRY_CODE="94" \
    EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend" \
    EMAIL_HOST="smtp.gmail.com" \
    EMAIL_PORT="587" \
    EMAIL_HOST_USER="<your-email@gmail.com>" \
    EMAIL_HOST_PASSWORD="<your-app-password>" \
    EMAIL_USE_TLS="True"
```

> **Secret Key:** Generate a strong secret key with:
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

---

### 3.2 Configure Startup Command

The repository includes `web/backend/startup.sh` which migrates the database, collects static files, and starts Gunicorn. Tell App Service to use it:

```bash
az webapp config set \
  --name foresto-backend \
  --resource-group foresto-rg \
  --startup-file "bash startup.sh"
```

The `startup.sh` script does:

```bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 config.wsgi:application
```

> **Static files:** Add `whitenoise` to `web/backend/requirements.txt` and insert
> `"whitenoise.middleware.WhiteNoiseMiddleware"` after `SecurityMiddleware` in `settings.py`
> so Django can serve its own static files without a separate storage service.

---

## 4. Configure the Frontend (Next.js)

### Point the Frontend at the Deployed Backend

In the Azure Portal (or CLI), add the following application setting to your **Static Web App**:

```bash
az staticwebapp appsettings set \
  --name foresto-frontend \
  --resource-group foresto-rg \
  --setting-names \
    NEXT_PUBLIC_API_BASE_URL="https://foresto-backend.azurewebsites.net"
```

Also update `web/frontend/next.config.ts` so the API proxy points to the Azure backend URL:

```ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
      },
    ];
  },
};
```

---

## 5. Set Up GitHub Actions (CI/CD)

Two workflow files are already created in `.github/workflows/`:

| File | Trigger | Deploys |
|---|---|---|
| `deploy-backend.yml` | Push to `main` affecting `web/backend/**` | Django → Azure App Service |
| `deploy-frontend.yml` | Push to `main` affecting `web/frontend/**` | Next.js → Azure Static Web Apps |

### 5.1 Backend Workflow Secrets

Go to **GitHub → Your repo → Settings → Secrets and variables → Actions** and add:

| Secret name | Value |
|---|---|
| `AZURE_BACKEND_APP_NAME` | `foresto-backend` |
| `AZURE_BACKEND_PUBLISH_PROFILE` | (see below) |

**Get the Publish Profile:**

```bash
az webapp deployment list-publishing-profiles \
  --name foresto-backend \
  --resource-group foresto-rg \
  --xml
```

Copy the entire XML output and paste it as the value of `AZURE_BACKEND_PUBLISH_PROFILE`.

---

### 5.2 Frontend Workflow Secrets

When you ran `az staticwebapp create` in section 2.4, Azure automatically added the
`AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your GitHub repository.

Verify it is present under **Settings → Secrets and variables → Actions**. If it is missing, retrieve it manually:

```bash
az staticwebapp secrets list \
  --name foresto-frontend \
  --resource-group foresto-rg \
  --query "properties.apiKey" -o tsv
```

Then add:

| Secret name | Value |
|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | (output of the command above) |
| `NEXT_PUBLIC_API_BASE_URL` | `https://foresto-backend.azurewebsites.net` |

---

## 6. First Deploy & Smoke Test

### Manual first deploy (if needed)

```bash
# Push current branch to trigger the GitHub Actions workflows
git push origin main
```

Watch the workflows in **GitHub → Actions**.

### Verify the backend

```bash
curl https://foresto-backend.azurewebsites.net/api/
```

You should receive a JSON response (or a 403/401 from DRF, which confirms the server is running).

### Verify the frontend

Open `https://foresto-frontend.azurestaticapps.net` in your browser. The login page should load.

---

## 7. Custom Domain & HTTPS (Optional)

### Backend (App Service)

```bash
az webapp config hostname add \
  --webapp-name foresto-backend \
  --resource-group foresto-rg \
  --hostname api.yourdomain.com

# Enable a free managed TLS certificate
az webapp config ssl bind \
  --name foresto-backend \
  --resource-group foresto-rg \
  --certificate-thumbprint $(az webapp config ssl create \
      --name foresto-backend \
      --resource-group foresto-rg \
      --hostname api.yourdomain.com \
      --query thumbprint -o tsv) \
  --ssl-type SNI
```

### Frontend (Static Web Apps)

```bash
az staticwebapp hostname set \
  --name foresto-frontend \
  --resource-group foresto-rg \
  --hostname app.yourdomain.com
```

Azure Static Web Apps provisions a free TLS certificate automatically.

After binding the custom domains, update `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and
`CSRF_TRUSTED_ORIGINS` in App Service settings to include the new domain names.

---

## 8. Environment Variable Reference

### Backend (Azure App Service → Configuration → Application Settings)

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Django secret key (keep private) | `s3cr3t...` |
| `DEBUG` | Set to `False` in production | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `foresto-backend.azurewebsites.net` |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) allowed by CORS | `https://foresto-frontend.azurestaticapps.net` |
| `CSRF_TRUSTED_ORIGINS` | Origins trusted for CSRF | `https://foresto-frontend.azurestaticapps.net` |
| `DATABASE_URL` | Full PostgreSQL connection URL | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_ACCESS_LIFETIME_MIN` | JWT access token lifetime (minutes) | `15` |
| `JWT_REFRESH_LIFETIME_DAYS` | JWT refresh token lifetime (days) | `7` |
| `WHATSAPP_ENABLED` | Enable WhatsApp notifications | `false` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business phone number ID | `1234567890` |
| `WHATSAPP_ACCESS_TOKEN` | Meta permanent access token | `EAA...` |
| `WHATSAPP_DEFAULT_COUNTRY_CODE` | Default dial code | `94` |
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_HOST_USER` | SMTP username / sender address | `you@gmail.com` |
| `EMAIL_HOST_PASSWORD` | SMTP password or App Password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_USE_TLS` | Use STARTTLS | `True` |

### Frontend (Azure Static Web Apps → Configuration)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the deployed Django API | `https://foresto-backend.azurewebsites.net` |

---

## 9. Cost-Saving Tips

| Resource | Recommended SKU | Monthly estimate |
|---|---|---|
| App Service Plan | B1 (Basic) | ~\$13 USD |
| PostgreSQL Flexible Server | Burstable B1ms | ~\$12 USD |
| Azure Static Web Apps | Free tier | \$0 USD |
| **Total** | | **~\$25 USD / month** |

- Scale the App Service Plan **down to F1 (Free)** for non-production environments (note: F1 does not support custom startup commands or always-on).
- Use **Azure Dev/Test pricing** if you have a Visual Studio subscription.
- Stop the PostgreSQL server when not in use during development:
  ```bash
  az postgres flexible-server stop --name foresto-db-server --resource-group foresto-rg
  ```

---

## 10. Troubleshooting

### Backend returns 500 / Application Error

1. Check live logs:
   ```bash
   az webapp log tail --name foresto-backend --resource-group foresto-rg
   ```
2. Make sure all required environment variables are set (especially `SECRET_KEY` and `DATABASE_URL`).
3. Confirm `DEBUG=False` and `ALLOWED_HOSTS` includes the App Service hostname.

### Database connection refused

- Verify the firewall rule `AllowAzureServices` exists on the PostgreSQL server.
- Check that the `DATABASE_URL` secret uses `sslmode=require`.
- Confirm `psycopg` (or `psycopg-binary`) is listed in `requirements.txt`.

### Frontend shows "Network Error" when calling the API

- Check that `NEXT_PUBLIC_API_BASE_URL` matches the exact backend URL (no trailing slash).
- Verify that `CORS_ALLOWED_ORIGINS` in App Service includes the frontend's Static Web Apps URL.
- Open the browser DevTools → Network tab to inspect which URL the frontend is calling.

### Migrations not running on startup

- Ensure the startup command is set to `bash startup.sh`:
  ```bash
  az webapp config show \
    --name foresto-backend \
    --resource-group foresto-rg \
    --query linuxFxVersion
  ```
- SSH into the App Service Kudu console and run migrations manually:
  ```bash
  az webapp ssh --name foresto-backend --resource-group foresto-rg
  cd /home/site/wwwroot && python manage.py migrate
  ```

### WhatsApp notifications not sending

- Set `WHATSAPP_ENABLED=true` and provide valid `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` values.
- Ensure your Meta Business account has the WhatsApp Cloud API product enabled.
