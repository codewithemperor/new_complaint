"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _swagger = require("@nestjs/swagger");
const _cookieparser = /*#__PURE__*/ _interop_require_default(require("cookie-parser"));
const _config = require("@nestjs/config");
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _appmodule = require("./app.module");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    const config = app.get(_config.ConfigService);
    // Global API prefix — everything mounts under /api (e.g. /api/auth/login).
    app.setGlobalPrefix('api');
    // Validation: strip unknown props, transform payloads to typed instances.
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
    }));
    // Cookies (httpOnly auth cookie) + CORS with credentials for the frontend.
    app.use((0, _cookieparser.default)());
    const configuredCorsOrigins = config.get('CORS_ORIGIN') ?? 'http://localhost:3000,https://kwmoc-complaint-frontend.vercel.app';
    const corsOrigins = configuredCorsOrigins.split(',').map((s)=>s.trim().replace(/\/+$/, '')).filter(Boolean);
    if (!corsOrigins.includes('https://kwmoc-complaint-frontend.vercel.app')) {
        corsOrigins.push('https://kwmoc-complaint-frontend.vercel.app');
    }
    app.enableCors({
        origin (origin, callback) {
            if (!origin) return callback(null, true);
            const normalizedOrigin = origin.replace(/\/+$/, '');
            return callback(null, corsOrigins.includes(normalizedOrigin));
        },
        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ],
        credentials: true
    });
    // JwtAuthGuard is registered globally via APP_GUARD in AppModule (DI-aware,
    // so its Reflector dependency is injected). No manual useGlobalGuards here.
    // Swagger / OpenAPI docs at /api.
    const swaggerConfig = new _swagger.DocumentBuilder().setTitle('KwaraMOc Complaints API').setDescription('Complaint Management & Ticketing System — backend API').setVersion('0.1.0').addBearerAuth().build();
    const document = _swagger.SwaggerModule.createDocument(app, swaggerConfig);
    _swagger.SwaggerModule.setup('api', app, document);
    // Serve uploaded files statically (local storage dev).
    app.useStaticAssets(_path.resolve(process.env.UPLOADS_DIR ?? './uploads'), {
        prefix: '/uploads/'
    });
    // Graceful drain on SIGTERM/SIGINT (nestjs-features-performance: "drain before shutdown").
    app.enableShutdownHooks();
    const port = config.get('PORT') ?? 4000;
    await app.listen(port);
    _common.Logger.log(`🚀 Backend running on http://localhost:${port}`, 'Bootstrap');
    _common.Logger.log(`📘 Swagger at http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();

//# sourceMappingURL=main.js.map