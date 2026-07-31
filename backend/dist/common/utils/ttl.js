"use strict";
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
    get ttlToMs () {
        return ttlToMs;
    },
    get ttlToSeconds () {
        return ttlToSeconds;
    }
});
const _ms = /*#__PURE__*/ _interop_require_default(require("ms"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function ttlToMs(ttl) {
    return (0, _ms.default)(ttl);
}
function ttlToSeconds(ttl) {
    return Math.floor(ttlToMs(ttl) / 1000);
}

//# sourceMappingURL=ttl.js.map