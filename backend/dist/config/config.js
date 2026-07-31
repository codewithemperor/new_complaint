"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "configValidationSchema", {
    enumerable: true,
    get: function() {
        return configValidationSchema;
    }
});
const _joi = /*#__PURE__*/ _interop_require_wildcard(require("joi"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}
const configValidationSchema = _joi.object({
    NODE_ENV: _joi.string().valid('development', 'production', 'test').default('development'),
    PORT: _joi.number().default(4000),
    // Database (SQLite default)
    DATABASE_URL: _joi.string().default('file:./prisma/dev.db'),
    // Auth
    JWT_SECRET: _joi.string().min(16).default('kwmoc-dev-secret-key-2026-min16'),
    JWT_ACCESS_TTL: _joi.string().default('8h'),
    APP_TOKEN_SECRET: _joi.string().min(16).default('kwmoc-tracking-token-secret-min16'),
    // CORS / cookies
    CORS_ORIGIN: _joi.string().default('http://localhost:3000'),
    COOKIE_DOMAIN: _joi.string().default('localhost'),
    COOKIE_SECURE: _joi.boolean().default(false),
    // Email (optional in dev — notifications silently skip)
    MAIL_HOST: _joi.string().allow(''),
    MAIL_PORT: _joi.number().default(2525),
    MAIL_USER: _joi.string().allow(''),
    MAIL_PASS: _joi.string().allow(''),
    MAIL_FROM: _joi.string().default('noreply@kwmoc.gov.ng'),
    // Storage
    STORAGE_DRIVER: _joi.string().valid('local', 'cloudinary').default('local'),
    UPLOADS_DIR: _joi.string().default('./uploads'),
    CLOUDINARY_CLOUD_NAME: _joi.string().allow(''),
    CLOUDINARY_API_KEY: _joi.string().allow(''),
    CLOUDINARY_API_SECRET: _joi.string().allow(''),
    // App
    APP_URL: _joi.string().default('http://localhost:3000'),
    // SLA (see planning/05-sla-matrix.md §1). Hours, calendar-time (working-day
    // math is deferred per §8). Override per environment if needed.
    SLA_P1_FIRST_RESPONSE_HOURS: _joi.number().default(1),
    SLA_P2_FIRST_RESPONSE_HOURS: _joi.number().default(4),
    SLA_P3_FIRST_RESPONSE_HOURS: _joi.number().default(24),
    SLA_P4_FIRST_RESPONSE_HOURS: _joi.number().default(48),
    SLA_P1_RESOLUTION_HOURS: _joi.number().default(24),
    SLA_P2_RESOLUTION_HOURS: _joi.number().default(72),
    SLA_P3_RESOLUTION_HOURS: _joi.number().default(240),
    SLA_P4_RESOLUTION_HOURS: _joi.number().default(360),
    SLA_WARNING_THRESHOLD: _joi.number().default(0.8),
    // Resolution & closure (see planning/milestone-6-resolution-closure.md).
    FEEDBACK_GRACE_DAYS: _joi.number().default(7),
    REOPEN_WINDOW_DAYS: _joi.number().default(14),
    // Archival retention (M8). Closed tickets archived after this many days.
    ARCHIVE_RETENTION_DAYS: _joi.number().default(90)
});

//# sourceMappingURL=config.js.map