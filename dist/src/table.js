"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const exceptions_1 = require("./exceptions");
class Table {
    name;
    entity;
    primaryKey;
    client;
    constructor(client) {
        this.name = Reflect.getMetadata('name', this.constructor);
        this.entity = Reflect.getMetadata('entity', this.constructor);
        this.primaryKey = Reflect.getMetadata('primaryKey', this.constructor);
        if (!this.entity) {
            throw new Error(`${this.constructor.name} requires an Entity to be defined. See @Table in dynamorm/decorators`);
        }
        this.client = client ? client : new client_dynamodb_1.DynamoDBClient();
    }
    static getName() {
        return Reflect.getMetadata('name', this);
    }
    getName() {
        return this.name;
    }
    getEntity(instance = false) {
        // @ts-ignore
        return instance ? new this.entity() : this.entity;
    }
    static getEntity(instance = false) {
        const Constructor = Reflect.getMetadata('entity', this);
        return instance ? new Constructor() : Constructor;
    }
    getPrimaryKeyDefinition() {
        const attributeDefinitions = this.toAttributeDefinition();
        const primaryKeyDefinition = {
            pk: {
                AttributeName: null,
                AttributeType: null,
            },
            sk: null
        };
        for (let attributeDefinition of attributeDefinitions) {
            const { AttributeName } = attributeDefinition;
            if (this.primaryKey.pk === AttributeName) {
                primaryKeyDefinition.pk = attributeDefinition;
            }
            else if (this.primaryKey.sk === AttributeName) {
                primaryKeyDefinition.sk = attributeDefinition;
            }
        }
        return primaryKeyDefinition;
    }
    getPrimaryKey() {
        return this.primaryKey;
    }
    toAttributeDefinition() {
        const AttributeDefinitions = [];
        const entity = new this.entity();
        const attributes = entity.getAttributeDefinitions();
        let partitionKeySet = false;
        let sortKeySet = false;
        for (let AttributeName in attributes) {
            const isPartitionKey = AttributeName == this.primaryKey.pk;
            const isSortKey = AttributeName == this.primaryKey.sk;
            if (isPartitionKey || isSortKey) {
                if (isPartitionKey)
                    partitionKeySet = true;
                if (isSortKey)
                    sortKeySet = true;
                AttributeDefinitions.push({
                    AttributeName,
                    AttributeType: attributes[AttributeName].type
                });
            }
        }
        if (!partitionKeySet) {
            const message = 'Partition key not set on ' + this.constructor.name;
            throw new Error(message);
        }
        if (this.primaryKey.sk && !sortKeySet) {
            const message = `Sort key is defined on ${this.constructor.name} but not found in any entities`;
            throw new Error(message);
        }
        return AttributeDefinitions;
    }
    toCreateCommandInput() {
        const AttributeDefinitions = this.toAttributeDefinition();
        const ProvisionedThroughput = {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
        };
        const KeySchema = [{
                AttributeName: this.primaryKey.pk,
                KeyType: client_dynamodb_1.KeyType.HASH
            }];
        if (this.primaryKey.sk) {
            KeySchema.push({
                AttributeName: this.primaryKey.sk,
                KeyType: client_dynamodb_1.KeyType.RANGE,
            });
        }
        return {
            TableName: this.name,
            AttributeDefinitions,
            KeySchema,
            ProvisionedThroughput
        };
    }
    toInputKey(primaryKey) {
        const { pk, sk } = this.getPrimaryKeyDefinition();
        if (!sk && primaryKey.sk) {
            const message = `${this.constructor.name} table does not have a sort key defined but you are attempting to do a look by ${primaryKey.sk} `;
            throw new exceptions_1.PrimaryKeyException(message);
        }
        const Key = {
            [pk.AttributeName]: {
                [pk.AttributeType]: primaryKey.pk
            }
        };
        if (primaryKey.sk) {
            Key[sk.AttributeName] = {
                [sk.AttributeType]: primaryKey.sk
            };
        }
        return Key;
    }
    async create() {
        const commandInput = this.toCreateCommandInput();
        const command = new client_dynamodb_1.CreateTableCommand(commandInput);
        let message = `Failed to save table ${this.constructor.name}`;
        let response;
        try {
            response = await this.client.send(command);
        }
        catch (e) {
            switch (e.constructor) {
                case client_dynamodb_1.ResourceInUseException:
                    message = `Table already exists "${this.constructor.name}"`;
                    break;
            }
            throw new Error(message);
        }
        return response;
    }
    /**
     * @description Gets table formation. If table has not been created will return undefined
     */
    async describe() {
        const command = new client_dynamodb_1.DescribeTableCommand({
            TableName: this.name
        });
        let response;
        try {
            response = await this.client.send(command);
        }
        catch (e) {
            switch (e.constructor) {
                case client_dynamodb_1.ResourceNotFoundException:
                    return;
                default:
                    throw new exceptions_1.DynamormException(e.message);
            }
        }
        return response;
    }
}
exports.default = Table;
