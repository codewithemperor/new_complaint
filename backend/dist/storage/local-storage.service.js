"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LocalStorageService", {
    enumerable: true,
    get: function() {
        return LocalStorageService;
    }
});
const _common = require("@nestjs/common");
const _fs = require("fs");
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
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
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
let LocalStorageService = class LocalStorageService {
    constructor(){
        this.logger = new _common.Logger(LocalStorageService.name);
        this.uploadsDir = _path.resolve(process.env.UPLOADS_DIR ?? './uploads');
    }
    async onModuleInit() {
        await _fs.promises.mkdir(this.uploadsDir, {
            recursive: true
        });
        this.logger.log(`Local storage ready at ${this.uploadsDir}`);
    }
    async save(file) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const ext = _path.extname(file.originalname);
        const basename = `${_crypto.randomUUID()}${ext}`;
        const relDir = _path.join(String(year), month);
        const absDir = _path.join(this.uploadsDir, relDir);
        await _fs.promises.mkdir(absDir, {
            recursive: true
        });
        const storedPath = _path.join(relDir, basename).split(_path.sep).join('/');
        await _fs.promises.writeFile(_path.join(absDir, basename), file.buffer);
        return {
            storedPath,
            filename: file.originalname,
            mimetype: file.mimetype,
            sizeBytes: file.size
        };
    }
    getUrl(storedPath) {
        // Served by the static route registered in main.ts (/uploads/...).
        return `/uploads/${storedPath}`;
    }
    async delete(storedPath) {
        const abs = _path.join(this.uploadsDir, storedPath);
        try {
            await _fs.promises.unlink(abs);
        } catch (err) {
            this.logger.warn(`Failed to delete ${abs}: ${err.message}`);
        }
    }
};
LocalStorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], LocalStorageService);

//# sourceMappingURL=local-storage.service.js.map