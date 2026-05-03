import os
import socket
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
dotenv_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(dotenv_path):
    environ.Env.read_env(dotenv_path)

# ─────────────────────────────────────────────────────
# Core Settings (read AFTER .env is loaded)
# ─────────────────────────────────────────────────────
SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)

if DEBUG:
    print("[settings] ✅ Local: .env loaded and DEBUG mode enabled")

# ✅ Azure automatically provides WEBSITE_HOSTNAME
AZURE_HOSTNAME = os.environ.get("WEBSITE_HOSTNAME", "")

# Only log detailed settings in DEBUG mode to reduce startup spam
if DEBUG:
    print(f"[settings] DEBUG           : {DEBUG}")
    print(f"[settings] AZURE_HOSTNAME  : '{AZURE_HOSTNAME}'")

# Ensure SSL cert bundle is available for TLS connections (macOS/local dev/Azure)
# If the environment hasn't provided SSL_CERT_FILE, prefer certifi when installed.
if not os.environ.get("SSL_CERT_FILE") and not (AZURE_HOSTNAME or not DEBUG):
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

# ✅ Auto add Azure hostname
if AZURE_HOSTNAME and AZURE_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(AZURE_HOSTNAME)

# ✅ Wildcard for azurewebsites.net
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

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
def _resolve_ipv4(hostname, port, timeout_sec=5):
    """
    Attempt IPv4 resolution with timeout - Azure App Service has no IPv6 outbound.
    Falls back to hostname if resolution fails or times out (avoids blocking startup).
    """
    if ":" in str(hostname):
        return hostname

    try:
        # Set socket timeout to prevent blocking during slow DNS lookups
        socket.setdefaulttimeout(timeout_sec)
        results = socket.getaddrinfo(
            hostname,
            port,
            socket.AF_INET,
            socket.SOCK_STREAM,
        )
        socket.setdefaulttimeout(None)  # Reset to default
        
        if results:
            ipv4 = results[0][4][0]
            return ipv4
        return hostname

    except (socket.gaierror, socket.timeout) as e:
        # DNS timeout or resolution failure - use hostname directly
        # The database driver will handle hostname resolution
        socket.setdefaulttimeout(None)  # Reset to default
        return hostname
    except Exception as e:
        socket.setdefaulttimeout(None)  # Reset to default
        return hostname


database_url = env("DATABASE_URL", default="")

if database_url:
    _parsed = urlparse(database_url)
    _hostname = _parsed.hostname or ""
    _port = _parsed.port or 5432

    # Attempt IPv4 resolution with 3-second timeout to avoid slow startup
    _host_ipv4 = _resolve_ipv4(_hostname, _port, timeout_sec=3)

    _query_options = dict(parse_qsl(_parsed.query))

    # ✅ Extract known options
    _sslmode = _query_options.pop("sslmode", "require")

    # ✅ pgbouncer=true → disable prepared statements
    _pgbouncer = _query_options.pop("pgbouncer", "false").lower() == "true"

    # ✅ Remove channel_binding (not supported by psycopg2)
    _query_options.pop("channel_binding", None)

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _parsed.path.lstrip("/"),
            "USER": _parsed.username,
            "PASSWORD": _parsed.password,
            "HOST": _host_ipv4,
            "PORT": _port,
            "CONN_MAX_AGE": 0 if _pgbouncer else 60,  # ✅ 0 for pgbouncer
            "OPTIONS": {
                "sslmode": _sslmode,
                # ✅ Disable prepared statements for pgbouncer
                **({"options": "-c default_transaction_isolation=read committed"} if _pgbouncer else {}),
            },
        }
    }

    print(f"[settings] DB NAME     : {_parsed.path.lstrip('/')}")
    print(f"[settings] DB HOST     : {_host_ipv4}")
    print(f"[settings] DB PORT     : {_port}")
    print(f"[settings] SSL MODE    : {_sslmode}")
    print(f"[settings] PGBOUNCER   : {_pgbouncer}")

else:
    print("[settings] ⚠️  No DATABASE_URL - using individual DB vars")
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
# Security
# ─────────────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = False  # Azure handles SSL

# ─────────────────────────────────────────────────────
# Misc
# ─────────────────────────────────────────────────────
FORECAST_MODEL_PATH = os.path.join(
    BASE_DIR, "artifacts", "forecasting", "menu_item_demand_model.pkl"
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
WHATSAPP_DEFAULT_COUNTRY_CODE = env("WHATSAPP_DEFAULT_COUNTRY_CODE", default="")

# ─────────────────────────────────────────────────────
# Email
# ─────────────────────────────────────────────────────
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="")
PURCHASE_EMAIL_FROM = env("PURCHASE_EMAIL_FROM", default="")
PURCHASE_AUTO_EMAIL_ON_CREATE = env.bool("PURCHASE_AUTO_EMAIL_ON_CREATE", default=True)
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=25)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=20)