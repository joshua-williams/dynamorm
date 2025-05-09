"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.DynamoRM = void 0;
require("reflect-metadata");
const model_1 = __importDefault(require("./model"));
const index_1 = require("../index");
/**
 * @todo throw error if tables or client is undefined
 */
class DynamoRM {
    tables;
    models;
    client;
    constructor(DB) {
        this.tables = Reflect.getMetadata('tables', DB);
        this.models = Reflect.getMetadata('models', DB) || [];
        this.client = Reflect.getMetadata('client', DB);
        if (!this.tables || !this.client) {
            throw new Error('A dynamodb client and tables are required');
        }
    }
    getTables() {
        return this.tables;
    }
    getTable(tableName) {
        for (let table of this.tables) {
            if (tableName === table.name) {
                return table;
            }
        }
    }
    async createTables() {
        const results = [];
        for (let Constructor of this.tables) {
            const table = new Constructor(this.client);
            const result = await table.create(Constructor);
            results.push(result);
        }
        return results;
    }
    getModels() {
        return this.models;
    }
    getModel(modelName) {
        for (let model of this.models) {
            if (modelName == model.name) {
                return model;
            }
        }
    }
    tableToModel(table) {
        const attributes = table.getEntity(true).getAttributeDefinitions();
        class DynamicModel extends model_1.default {
            attributes = attributes;
        }
        ;
        Reflect.defineMetadata('table', table, DynamicModel);
        Object.assign(DynamicModel.prototype, index_1.Entity);
        return new DynamicModel(this.client);
    }
    /**
     * @description Gets instance of model
     * @param modelName
     * @param attributes
     */
    model(modelName, attributes) {
        let Constructor = this.getModel(modelName);
        let model;
        if (Constructor) {
            model = new Constructor(this.client);
        }
        else {
            for (let table of this.tables) {
                const entityConstructor = table.getEntity();
                if (entityConstructor.name == modelName) {
                    model = this.tableToModel(table);
                    break;
                }
            }
        }
        if (!model)
            return;
        if (attributes) {
            model.fill(attributes);
        }
        return model;
    }
}
exports.DynamoRM = DynamoRM;
const create = (App) => {
    return new DynamoRM(App);
};
exports.create = create;
exports.default = {
    create: exports.create
};
