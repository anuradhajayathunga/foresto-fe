import os
import socket
import environ
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlparse, parse_qsl

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1", "[::1]", ".azurewebsites.net"],
)


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3rd party
    "corsheaders",
    "rest_framework",
    "django_filters",

    # local apps
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
def _resolve_ipv4(hostname, port):
    """
    Resolve hostname to IPv4 address.
    Prevents psycopg3 from picking an IPv6 address on Railway,
    which has no IPv6 network route (causes 'Network is unreachable').
    """
    try:
        results = socket.getaddrinfo(
            hostname,
            port,
            socket.AF_INET,       # IPv4 only
            socket.SOCK_STREAM,
        )
        return results[0][4][0]
    except Exception:
        return hostname           # fall back to original hostname


database_url = env("DATABASE_URL", default="")

if database_url:
    _parsed = urlparse(database_url)
    _hostname = _parsed.hostname
    _port = _parsed.port or 5432

    # Resolve hostname to IPv4 at startup
    _host_ipv4 = _resolve_ipv4(_hostname, _port)

    if _host_ipv4 != _hostname:
        print(f"[settings] DB host resolved: {_hostname} → {_host_ipv4}")
    else:
        print(f"[settings] DB host (unchanged): {_hostname}")

    # Extract query options (e.g. sslmode=require, channel_binding=require)
    _query_options = dict(parse_qsl(_parsed.query))

    # sslmode must go into OPTIONS for psycopg
    _sslmode = _query_options.pop("sslmode", "require")

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _parsed.path.lstrip("/"),
            "USER": _parsed.username,
            "PASSWORD": _parsed.password,
            "HOST": _host_ipv4,
            "PORT": _port,
            "CONN_MAX_AGE": 60,
            "OPTIONS": {
                "sslmode": _sslmode,
                **_query_options,
            },
        }
    }

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

# ---------------------------------------------------------------------------
# CORS / CSRF
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
)

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

# ---------------------------------------------------------------------------
# REST Framework / JWT
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "accounts.auth_backend.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# ---------------------------------------------------------------------------
# Localisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Colombo"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------
FORECAST_MODEL_PATH = os.path.join(
    BASE_DIR, "artifacts", "forecasting", "menu_item_demand_model.pkl"
)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# WhatsApp Cloud API
# ---------------------------------------------------------------------------
WHATSAPP_ENABLED = env.bool("WHATSAPP_ENABLED", default=False)
WHATSAPP_API_BASE = env("WHATSAPP_API_BASE", default="https://graph.facebook.com")
WHATSAPP_API_VERSION = env("WHATSAPP_API_VERSION", default="v21.0")
WHATSAPP_PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID", default="")
WHATSAPP_ACCESS_TOKEN = env("WHATSAPP_ACCESS_TOKEN", default="")
WHATSAPP_DEFAULT_COUNTRY_CODE = env("WHATSAPP_DEFAULT_COUNTRY_CODE", default="")

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="ishiwara.anu31@gmail.com")
PURCHASE_EMAIL_FROM = env("PURCHASE_EMAIL_FROM", default="ishiwaraanuradha@gmail.com")
PURCHASE_AUTO_EMAIL_ON_CREATE = env.bool("PURCHASE_AUTO_EMAIL_ON_CREATE", default=True)

EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=25)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=20)