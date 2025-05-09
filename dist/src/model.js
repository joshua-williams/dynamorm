"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const exceptions_1 = require("./exceptions");
class Model {
    client;
    name;
    table;
    entity;
    attributes = {};
    primaryKey;
    constructor(client) {
        this.client = client;
        this.table = new (Reflect.getMetadata('table', this.constructor));
        this.entity = this.table.getEntity(true);
        this.attributes = this.entity.getAttributeDefinitions();
        this.primaryKey = this.table.getPrimaryKey();
        for (let attribute in this.attributes) {
            Object.defineProperty(this, attribute, {
                get() {
                    return this.attributes[attribute].value;
                },
                set(value) {
                    const result = this.validateAttribute(this.attributes[attribute], value);
                    if (result instanceof TypeError) {
                        result.message = `${attribute} must be a ${result.message} on ${this.constructor.name}`;
                        throw result;
                    }
                    this.attributes[attribute].value = value;
                }
            });
        }
    }
    fill(attribute, value) {
        switch (typeof attribute) {
            case 'string':
                this.set(attribute, value);
                break;
            case 'object':
                for (let attr in attribute) {
                    this.set(attr, attribute[attr]);
                }
                break;
        }
    }
    /**
     * @description Sets named attribute value
     * @param attributeName
     * @param value
     */
    set(attributeName, value) {
        if (this.attributes.hasOwnProperty(attributeName)) {
            this.attributes[attributeName].value = value;
        }
    }
    /**
     * @description Sets named attribute value. If attribute not set and defaultValue is not provided an error is thrown
     * @param attributeName
     */
    get(attributeName) {
        if (this.attributes.hasOwnProperty(attributeName)) {
            return this.attributes[attributeName].value;
        }
        throw new Error(`Attribute not found: ${attributeName}`);
    }
    /**
     * @description Gets PrimaryKey including values
     */
    getPrimaryKey() {
        const primaryKeyDefinition = this.table.getPrimaryKeyDefinition();
        const primaryKey = {
            pk: this.attributes[primaryKeyDefinition.pk.AttributeName].value,
            sk: undefined
        };
        if (primaryKeyDefinition.sk) {
            primaryKey.sk = this.attributes[primaryKeyDefinition.sk.AttributeName].value;
        }
        return primaryKey;
    }
    getAttributes() {
        return this.attributes;
    }
    getAttributeValues(omitUndefined = true) {
        return Object.keys(this.attributes).reduce((attributes, attribute) => {
            attributes[attribute] = this.attributes[attribute].value;
            return attributes;
        }, {});
    }
    static getEntity() {
        return Reflect.getMetadata('entity', this);
    }
    getEntity(instance = false) {
        return this.table.getEntity(instance);
    }
    async save() {
        const { valid, errors } = this.validate();
        if (!valid)
            throw new exceptions_1.ValidationError(errors);
        const input = this.toPutCommandInput();
        const command = new client_dynamodb_1.PutItemCommand(input);
        let result;
        try {
            result = await this.client.send(command);
        }
        catch (e) {
            let message = `Failed to save dynamo model ${this.constructor.name}. ${e.message}`;
            switch (e.constructor) {
                case client_dynamodb_1.ResourceNotFoundException:
                    const { statusCode, reason } = e.$response;
                    switch (statusCode) {
                        case 400:
                            message = `dynamodb table does not exist "${this.table.getName()}"`;
                            break;
                    }
                    throw new exceptions_1.TableNotFoundException(message);
                default:
                    throw new exceptions_1.ServiceUnavailableException(message);
            }
        }
        return result;
    }
    async fresh() {
        const { valid, errors } = this.validatePrimaryKey();
        if (!valid) {
            throw new exceptions_1.PrimaryKeyException(errors[0]);
        }
        const model = await this.find();
        if (model === undefined)
            return false;
        for (let attributeName in this.attributes) {
            if (model.attributes.hasOwnProperty(attributeName)) {
                this.attributes[attributeName].value = model.attributes[attributeName].value;
            }
        }
        return true;
    }
    async find(pk, sk) {
        const primaryKeyDefinition = this.table.getPrimaryKeyDefinition();
        if (primaryKeyDefinition.sk && !sk) {
            throw new exceptions_1.PrimaryKeyException(`Failed to fetch item. Primary key requires partition key and sort key on ${this.table.constructor.name}`);
        }
        const primaryKeyValues = this.getPrimaryKey();
        const input = {
            TableName: this.table.getName(),
            // @ts-ignore
            Key: this.table.toInputKey(primaryKeyValues)
        };
        const command = new client_dynamodb_1.GetItemCommand(input);
        let result;
        try {
            result = await this.client.send(command);
            if (!result.hasOwnProperty('Item'))
                return;
            const attributes = {};
            for (let attribute in result.Item) {
                attributes[attribute] = Object.values(result.Item[attribute])[0];
                ;
            }
            const modelConstructor = this.constructor;
            const model = new modelConstructor(this.client);
            model.fill(attributes);
            return model;
        }
        catch (e) {
            throw new exceptions_1.DynamormException(e.message);
        }
    }
    /**
     * @description Delete an item by primary key
     * @param pk - Partition key
     * @param sk - (optional) Sort Key
     * @return boolean - True if an item was deleted. False if primary key did not match an item and nothing was deleted
     */
    async delete(pk, sk) {
        const primaryKey = {
            pk: pk || this.table.getPrimaryKey().pk,
            sk: sk || this.table.getPrimaryKey().sk,
        };
        const primaryKeyDefinition = this.table.getPrimaryKeyDefinition();
        if (primaryKeyDefinition.sk && !sk) {
            throw new exceptions_1.PrimaryKeyException(`Failed to delete item. Primary key requires partition key and sort key on ${this.table.constructor.name}`);
        }
        const input = {
            TableName: this.table.getName(),
            // @ts-ignore
            Key: this.table.toInputKey(primaryKey),
            ReturnValues: "ALL_OLD"
        };
        const command = new client_dynamodb_1.DeleteItemCommand(input);
        let result;
        try {
            result = await this.client.send(command);
            return result.hasOwnProperty('Attributes');
        }
        catch (e) {
            console.log(e);
        }
    }
    clear() {
        for (let attributeName in this.attributes) {
            this.attributes[attributeName].value = undefined;
        }
    }
    validatePrimaryKey() {
        const primaryKey = this.table.getPrimaryKey();
        const className = this.constructor.name === 'DynamicModel' ? this.entity.constructor.name : this.constructor.name;
        const errors = [];
        // Validate partition key defined on table is also defined as attribute in respective entity
        if (!this.attributes.hasOwnProperty(primaryKey.pk)) {
            errors.push(`Partition key "${primaryKey.pk}" is not defined in ${className}`);
        }
        // Validate partition key defined on table is set in respective entity
        if (this.attributes[primaryKey.pk].value === undefined) {
            errors.push(`Partition key "${primaryKey.pk}" is not set in ${className}`);
        }
        // Validate sort key defined on table is also defined as attribute in respective entity
        if (primaryKey.sk && !this.attributes.hasOwnProperty(primaryKey.sk)) {
            errors.push(`Sort key "${primaryKey.sk}" is not defined in ${className}`);
        }
        // Validate sort key defined on table is set in respective entity
        if (primaryKey.sk && this.attributes[primaryKey.sk].value === undefined) {
            errors.push(`Sort key "${primaryKey.sk}" is not set in ${this.constructor.name}`);
        }
        return {
            valid: !errors.length,
            errors
        };
    }
    validate() {
        const className = this.constructor.name === 'DynamicModel' ? this.entity.constructor.name : this.constructor.name;
        const errors = [];
        const result = this.validatePrimaryKey();
        if (!result.valid)
            errors.push(...result.errors);
        for (let attributeName in this.attributes) {
            const attribute = this.attributes[attributeName];
            // Validate required attribute is set
            if (attribute.required && attribute.value === undefined) {
                errors.push(`"${attributeName}" is required on ${this.constructor.name}`);
                continue;
            }
            // Skip validation of optional attribute that has not been set
            if (!attribute.required && attribute.value === undefined)
                continue;
            const result = this.validateAttribute(attribute, attribute.value);
            if (result instanceof TypeError) {
                errors.push(`TypeError: "${attributeName}" should be ${result.message}`);
            }
        }
        return {
            valid: !errors.length,
            errors
        };
    }
    validateAttribute(attribute, value) {
        switch (attribute.type.toLowerCase()) {
            case 's':
                if ((typeof value) != 'string')
                    return new TypeError('string');
                break;
            case 'ss':
                if (!(value instanceof Array))
                    return new TypeError('string set');
                for (let v of value) {
                    if ((typeof v) !== 'string')
                        return new TypeError('string set');
                }
                break;
            case 'n':
                if ((typeof value) !== 'number')
                    return new TypeError('number');
                break;
            case 'ns':
                if (!(value instanceof Array))
                    return new TypeError('number set');
                for (let v of value) {
                    if ((typeof v) !== 'number')
                        return new TypeError('number set');
                }
                break;
            case 'bb':
                if (typeof value != 'boolean')
                    return new TypeError('boolean');
                break;
            case 'map':
                // @ts-ignore
                if (typeof value != 'object')
                    return new TypeError('object');
                break;
            case 'l':
                if (!(value instanceof Array))
                    return new TypeError('array');
                const validTypes = ['string', 'number'];
                for (let v of value) {
                    if (!validTypes.includes(typeof v))
                        return new TypeError('primitive');
                }
                break;
        }
        return true;
    }
    toPutCommandInput() {
        const input = {
            TableName: this.table.getName(),
            Item: {}
        };
        for (let name in this.attributes) {
            const attribute = this.attributes[name];
            if (attribute.value === undefined)
                continue;
            input.Item[name] = {
                [attribute.type]: attribute.value
            };
        }
        return input;
    }
}
exports.default = Model;
