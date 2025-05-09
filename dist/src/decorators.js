"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = exports.attribute = exports.dynamorm = exports.model = exports.table = void 0;
require("reflect-metadata");
const types_1 = require("./types");
function table(options) {
    return function (constructor) {
        Reflect.defineMetadata("name", options.name, constructor);
        Reflect.defineMetadata("primaryKey", options.primaryKey, constructor);
        Reflect.defineMetadata("entity", options.entity, constructor);
    };
}
exports.table = table;
function model(options) {
    return function (constructor) {
        Reflect.defineMetadata('table', options.table, constructor);
    };
}
exports.model = model;
function dynamorm(options) {
    return function (constructor) {
        Reflect.defineMetadata("client", options.client, constructor);
        Reflect.defineMetadata("tables", options.tables, constructor);
        Reflect.defineMetadata("models", options.models, constructor);
    };
}
exports.dynamorm = dynamorm;
function attribute(type = types_1.AttributeType.String, required = false) {
    return function (constructor, key) {
        let attributes = Reflect.getMetadata('attributes', constructor);
        if (attributes) {
            attributes[key] = { type, required };
        }
        else {
            attributes = {
                [key]: { type, required }
            };
        }
        Reflect.defineMetadata('attributes', attributes, constructor);
    };
}
exports.attribute = attribute;
function Entity(constructor) {
    Reflect.defineMetadata('entity', constructor.name, constructor);
}
exports.Entity = Entity;
