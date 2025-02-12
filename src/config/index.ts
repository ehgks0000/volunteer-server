import type { CorsOptions } from "cors";
import type { _StrategyOptionsBase } from "passport-google-oauth20";

export const isProd = process.env.NODE_ENV === "production";
export const PORT = process.env.PORT || 3000;
export const HTTPS_PORT = process.env.HTTPS_PORT || 3001;

export const CLIENT_DOMAIN =
  process.env.CLIENT_DOMAIN || "http://localhost:3000";

export const SESSION_SECRET = process.env.SESSION_SECRET || "secretDevelopment";

export const REDIS_URL = process.env.REDIS_URL || "localhost:6379";

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 14; // 30일

export const SESSION_OPTION = {
  secret: SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: COOKIE_MAX_AGE,
    secure: false,
    httpOnly: true,
  },
};

export const API_PREFIX = "/api";

export const GOOGLE_CONFIG: _StrategyOptionsBase = {
  clientID: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackURL:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://www.example.com/auth/google/callback",
};

export const CORS_CONFIG: CorsOptions = isProd
  ? { origin: CLIENT_DOMAIN, credentials: true }
  : { origin: "*" };

export const S3_BUCKET = process.env.S3_BUCKET || "seeme";
