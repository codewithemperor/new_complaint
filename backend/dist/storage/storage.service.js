/**
 * Storage port. Feature services depend on this abstraction, not on a concrete
 * driver. The implementation is selected by STORAGE_DRIVER env.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get STORAGE_SERVICE () {
        return STORAGE_SERVICE;
    },
    get StorageService () {
        return StorageService;
    }
});
const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
let StorageService = class StorageService {
};

//# sourceMappingURL=storage.service.js.map