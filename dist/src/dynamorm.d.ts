import 'reflect-metadata';
import { CreateTableCommandOutput } from "@aws-sdk/client-dynamodb";
import Model from "./model";
import { IDynamoRM, ModelConstructor, TableConstructor } from "./types";
/**
 * @todo throw error if tables or client is undefined
 */
export declare class DynamoRM {
    private readonly tables;
    private readonly models;
    private readonly client;
    constructor(DB: Function);
    getTables(): any[];
    getTable(tableName: string): TableConstructor;
    createTables(): Promise<CreateTableCommandOutput[]>;
    getModels(): Array<ModelConstructor>;
    getModel(modelName: string): ModelConstructor;
    private tableToModel;
    /**
     * @description Gets instance of model
     * @param modelName
     * @param attributes
     */
    model<T>(modelName: string, attributes?: Record<string, any>): Model & T;
}
export declare const create: (App: Function) => IDynamoRM;
declare const _default: {
    create: (App: Function) => IDynamoRM;
};
export default _default;
//# sourceMappingURL=dynamorm.d.ts.map