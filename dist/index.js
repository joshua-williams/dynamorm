"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = exports.DynamoRM = exports.DynamormFactory = exports.Model = exports.Entity = exports.Table = void 0;
var table_1 = require("./src/table");
Object.defineProperty(exports, "Table", { enumerable: true, get: function () { return __importDefault(table_1).default; } });
var entity_1 = require("./src/entity");
Object.defineProperty(exports, "Entity", { enumerable: true, get: function () { return __importDefault(entity_1).default; } });
var model_1 = require("./src/model");
Object.defineProperty(exports, "Model", { enumerable: true, get: function () { return __importDefault(model_1).default; } });
var dynamorm_1 = require("./src/dynamorm");
Object.defineProperty(exports, "DynamormFactory", { enumerable: true, get: function () { return __importDefault(dynamorm_1).default; } });
Object.defineProperty(exports, "DynamoRM", { enumerable: true, get: function () { return dynamorm_1.DynamoRM; } });
__exportStar(require("./src/decorators"), exports);
exports.types = __importStar(require("./src/types"));
