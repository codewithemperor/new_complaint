"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StorageModule", {
    enumerable: true,
    get: function() {
        return StorageModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _storageservice = require("./storage.service");
const _cloudinarystorageservice = require("./cloudinary-storage.service");
const _localstorageservice = require("./local-storage.service");
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
let StorageModule = class StorageModule {
};
StorageModule = _ts_decorate([
    (0, _common.Module)({
        providers: [
            {
                provide: _storageservice.STORAGE_SERVICE,
                inject: [
                    _config.ConfigService
                ],
                useFactory: (config)=>{
                    const driver = config.get('STORAGE_DRIVER') ?? (config.get('NODE_ENV') === 'production' ? 'cloudinary' : 'local');
                    if (driver === 'cloudinary') return new _cloudinarystorageservice.CloudinaryStorageService();
                    return new _localstorageservice.LocalStorageService();
                }
            }
        ],
        exports: [
            _storageservice.STORAGE_SERVICE
        ]
    })
], StorageModule);

//# sourceMappingURL=storage.module.js.map