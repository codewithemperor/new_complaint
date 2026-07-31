/**
 * Client
**/ "use strict";
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
    get $Enums () {
        return $Enums;
    },
    get ApprovalStatus () {
        return ApprovalStatus;
    },
    get ApproverRole () {
        return ApproverRole;
    },
    get AttachmentKind () {
        return AttachmentKind;
    },
    get AuditEventType () {
        return AuditEventType;
    },
    get AwaitingState () {
        return AwaitingState;
    },
    get Channel () {
        return Channel;
    },
    get MovementType () {
        return MovementType;
    },
    get NotificationStatus () {
        return NotificationStatus;
    },
    get Priority () {
        return Priority;
    },
    get Prisma () {
        return Prisma;
    },
    get PrismaClient () {
        return PrismaClient;
    },
    get Role () {
        return Role;
    },
    get Sensitivity () {
        return Sensitivity;
    },
    get TicketStatus () {
        return TicketStatus;
    }
});
const _library = /*#__PURE__*/ _interop_require_wildcard(require("./runtime/library.js"));
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
const $Public = _library.Types.Public;
const $Extensions = _library.Types.Extensions;
(function($Enums) {})($Enums || ($Enums = {}));
const Role;
const TicketStatus;
const Priority;
const Channel;
const Sensitivity;
const AwaitingState;
const AttachmentKind;
const NotificationStatus;
const MovementType;
const ApprovalStatus;
const ApproverRole;
const AuditEventType;
let PrismaClient = class PrismaClient {
};
(function(Prisma) {
    Prisma.DMMF = _library.DMMF;
    /**
   * Validator
   */ Prisma.validator = _library.Public.validator;
    /**
   * Prisma Errors
   */ Prisma.PrismaClientKnownRequestError = _library.PrismaClientKnownRequestError;
    Prisma.PrismaClientUnknownRequestError = _library.PrismaClientUnknownRequestError;
    Prisma.PrismaClientRustPanicError = _library.PrismaClientRustPanicError;
    Prisma.PrismaClientInitializationError = _library.PrismaClientInitializationError;
    Prisma.PrismaClientValidationError = _library.PrismaClientValidationError;
    /**
   * Re-export of sql-template-tag
   */ Prisma.sql = _library.sqltag;
    Prisma.empty = _library.empty;
    Prisma.join = _library.join;
    Prisma.raw = _library.raw;
    Prisma.Sql = _library.Sql;
    /**
   * Decimal.js
   */ Prisma.Decimal = _library.Decimal;
    /**
  * Extensions
  */ Prisma.Extension = $Extensions.UserArgs;
    Prisma.getExtensionContext = _library.Extensions.getExtensionContext;
    Prisma.Args = $Public.Args;
    Prisma.Payload = $Public.Payload;
    Prisma.Result = $Public.Result;
    Prisma.Exact = $Public.Exact;
    /**
   * Utility Types
   */ Prisma.Bytes = _library.Bytes;
    Prisma.JsonObject = _library.JsonObject;
    Prisma.JsonArray = _library.JsonArray;
    Prisma.JsonValue = _library.JsonValue;
    Prisma.InputJsonObject = _library.InputJsonObject;
    Prisma.InputJsonArray = _library.InputJsonArray;
    Prisma.InputJsonValue = _library.InputJsonValue;
    /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */ (function(NullTypes) {
        /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */ let DbNull = class DbNull {
        };
        /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */ let JsonNull = class JsonNull {
        };
        /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */ let AnyNull = class AnyNull {
        };
    })(NullTypes || (NullTypes = {}));
    var NullTypes;
})(Prisma || (Prisma = {}));
var $Enums, Prisma;

//# sourceMappingURL=index.d.js.map