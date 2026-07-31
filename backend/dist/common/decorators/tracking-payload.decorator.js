"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrackingPayload", {
    enumerable: true,
    get: function() {
        return TrackingPayload;
    }
});
const _common = require("@nestjs/common");
const TrackingPayload = (0, _common.createParamDecorator)((_data, ctx)=>{
    const request = ctx.switchToHttp().getRequest();
    return request.tracking;
});

//# sourceMappingURL=tracking-payload.decorator.js.map