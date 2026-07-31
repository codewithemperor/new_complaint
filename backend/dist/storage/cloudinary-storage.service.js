"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CloudinaryStorageService", {
    enumerable: true,
    get: function() {
        return CloudinaryStorageService;
    }
});
const _common = require("@nestjs/common");
const _cloudinary = require("cloudinary");
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
let CloudinaryStorageService = class CloudinaryStorageService {
    ensureConfigured() {
        if (this.configured) return;
        _cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        this.configured = true;
    }
    async save(file) {
        this.ensureConfigured();
        const result = await new Promise((resolve, reject)=>{
            const stream = _cloudinary.v2.uploader.upload_stream({
                resource_type: 'auto',
                folder: 'kwmoc-complaints'
            }, (err, res)=>err ? reject(err) : resolve(res));
            stream.end(file.buffer);
        });
        return {
            storedPath: result.public_id,
            filename: file.originalname,
            mimetype: file.mimetype,
            sizeBytes: file.size
        };
    }
    getUrl(storedPath) {
        this.ensureConfigured();
        return _cloudinary.v2.url(storedPath, {
            resource_type: 'auto'
        });
    }
    async delete(storedPath) {
        this.ensureConfigured();
        try {
            await _cloudinary.v2.uploader.destroy(storedPath);
        } catch (err) {
            this.logger.warn(`Failed to delete ${storedPath}: ${err.message}`);
        }
    }
    constructor(){
        this.logger = new _common.Logger(CloudinaryStorageService.name);
        this.configured = false;
    }
};
CloudinaryStorageService = _ts_decorate([
    (0, _common.Injectable)()
], CloudinaryStorageService);

//# sourceMappingURL=cloudinary-storage.service.js.map