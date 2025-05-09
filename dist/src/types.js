"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributeType = exports.AttributeRequired = void 0;
exports.AttributeRequired = true;
var AttributeType;
(function (AttributeType) {
    AttributeType["String"] = "S";
    AttributeType["Number"] = "N";
    AttributeType["Binary"] = "B";
    AttributeType["Boolean"] = "BB";
    AttributeType["Null"] = "NULL";
    AttributeType["Map"] = "M";
    AttributeType["List"] = "L";
    AttributeType["StringSet"] = "SS";
    AttributeType["NumberSet"] = "NS";
    AttributeType["BinarySet"] = "BS";
})(AttributeType || (exports.AttributeType = AttributeType = {}));
