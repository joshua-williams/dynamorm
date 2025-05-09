"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Entity {
    getAttributeDefinitions() {
        const properties = Reflect.ownKeys(this);
        const attributes = Reflect.getMetadata('attributes', this);
        const reducer = (attributeDefinitions, name) => {
            if (!attributes.hasOwnProperty(name))
                return attributeDefinitions;
            const { type, required } = attributes[name];
            attributeDefinitions[name] = { type, required, value: this[name] };
            return attributeDefinitions;
        };
        return properties.reduce(reducer, {});
    }
}
exports.default = Entity;
