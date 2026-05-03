import os
import environ
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlparse, parse_qsl

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))

# ─────────────────────────────────────────────────────
# Load .env ONLY for local development
# Azure uses Configuration → Application Settings
# ─────────────────────────────────────────────────────
dotenv_path = BASE_DIR / ".env"
if dotenv_path.exists():
    environ.Env.read_env(str(dotenv_path))

# ─────────────────────────────────────────────────────
# Core Settings
# ─────────────────────────────────────────────────────
SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)

AZURE_HOSTNAME = os.environ.get("WEBSITE_HOSTNAME", "")

if DEBUG:
    print("[settings] DEBUG mode enabled")
    print(f"[settings] BASE_DIR       : {BASE_DIR}")
    print(f"[settings] AZURE_HOSTNAME : {AZURE_HOSTNAME}")

# ─────────────────────────────────────────────────────
# SSL Certificate Bundle
# ─────────────────────────────────────────────────────
# Useful for local/macOS TLS issues. Azure normally already has CA certs.
if not os.environ.get("SSL_CERT_FILE") and DEBUG:
    try:
        import certifi

        os.environ["SSL_CERT_FILE"] = certifi.where()
    except Exception:
        pass

# ─────────────────────────────────────────────────────
# ALLOWED HOSTS
# ─────────────────────────────────────────────────────
ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1", "[::1]"],
)

if AZURE_HOSTNAME and AZURE_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(AZURE_HOSTNAME)

if ".azurewebsites.net" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(".azurewebsites.net")

# ─────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
)

if AZURE_HOSTNAME:
    azure_origin = f"https://{AZURE_HOSTNAME}"
    if azure_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(azure_origin)

# ─────────────────────────────────────────────────────
# CSRF
# ─────────────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://*.azurewebsites.net",
    ],
)

if AZURE_HOSTNAME:
    azure_origin = f"https://{AZURE_HOSTNAME}"
    if azure_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(azure_origin)

# ─────────────────────────────────────────────────────
# Installed Apps
# ─────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "corsheaders",
    "rest_framework",
    "django_filters",

    "core",
    "accounts",
    "menu",
    "sales",
    "inventory",
    "purchases",
    "imports",
    "forecasting",
    "kitchen",
]

# ─────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ─────────────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────────────
database_url = env("DATABASE_URL", default="")

if database_url:
    parsed = urlparse(database_url)
    query_options = dict(parse_qsl(parsed.query))

    sslmode = query_options.pop("sslmode", "require")
    pgbouncer = query_options.pop("pgbouncer", "false").lower() == "true"

    db_options = {
        "sslmode": sslmode,
    }

    # Supabase transaction pooler / pgbouncer mode:
    # Disable prepared statements for psycopg 3.
    if pgbouncer:
        db_options["prepare_threshold"] = None

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path.lstrip("/") or "postgres",
            "USER": parsed.username,
            "PASSWORD": parsed.password,
            "HOST": parsed.hostname,
            "PORT": parsed.port or 5432,
            "CONN_MAX_AGE": 0 if pgbouncer else 60,
            "DISABLE_SERVER_SIDE_CURSORS": True if pgbouncer else False,
            "OPTIONS": db_options,
        }
    }

    if DEBUG:
        print(f"[settings] DB NAME   : {parsed.path.lstrip('/') or 'postgres'}")
        print(f"[settings] DB HOST   : {parsed.hostname}")
        print(f"[settings] DB PORT   : {parsed.port or 5432}")
        print(f"[settings] SSL MODE  : {sslmode}")
        print(f"[settings] PGBOUNCER : {pgbouncer}")

else:
    DATABASES = {
        "default": {
            "ENGINE": env("DB_ENGINE", default="django.db.backends.postgresql"),
            "NAME": env("DB_NAME", default=""),
            "USER": env("DB_USER", default=""),
            "PASSWORD": env("DB_PASSWORD", default=""),
            "HOST": env("DB_HOST", default=""),
            "PORT": env.int("DB_PORT", default=5432),
        }
    }

# ─────────────────────────────────────────────────────
# REST Framework / JWT
# ─────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ─────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "accounts.auth_backend.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# ─────────────────────────────────────────────────────
# Localisation
# ─────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Colombo"
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────────────────
# Static Files
# ─────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ─────────────────────────────────────────────────────
# Media Files
# ─────────────────────────────────────────────────────
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ─────────────────────────────────────────────────────
# Security
# ─────────────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = False

# ─────────────────────────────────────────────────────
# Misc
# ─────────────────────────────────────────────────────
FORECAST_MODEL_PATH = os.path.join(
    BASE_DIR,
    "artifacts",
    "forecasting",
    "menu_item_demand_model.pkl",
)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─────────────────────────────────────────────────────
# WhatsApp
# ─────────────────────────────────────────────────────
WHATSAPP_ENABLED = env.bool("WHATSAPP_ENABLED", default=False)
WHATSAPP_API_BASE = env("WHATSAPP_API_BASE", default="https://graph.facebook.com")
WHATSAPP_API_VERSION = env("WHATSAPP_API_VERSION", default="v21.0")
WHATSAPP_PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID", default="")
WHATSAPP_ACCESS_TOKEN = env("WHATSAPP_ACCESS_TOKEN", default="")
WHATSAPP_DEFAULT_COUNTRY_CODE = env("WHATSAPP_DEFAULT_COUNTRY_CODE", default="94")

# ─────────────────────────────────────────────────────
# Email
# ─────────────────────────────────────────────────────
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="")
PURCHASE_EMAIL_FROM = env("PURCHASE_EMAIL_FROM", default=DEFAULT_FROM_EMAIL)
PURCHASE_AUTO_EMAIL_ON_CREATE = env.bool("PURCHASE_AUTO_EMAIL_ON_CREATE", default=True)

EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=20)