import Entity from "./entity";
import Table from "./table";
import { CreateTableCommandOutput, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import Model from "./model";
export type EntityConstructor = {
    name: string;
    new (): Entity;
};
export type Entities = Record<string, EntityConstructor>;
export interface EntityAttributes extends Record<string | symbol, any> {
}
export type Attributes = Record<string, any>;
export type DTO = Record<string, any>;
export type AttributeDefinition = {
    type: string;
    required?: boolean;
    value?: any;
};
export type AttributeDefinitions = {
    [key: string]: AttributeDefinition;
};
export declare const AttributeRequired = true;
export declare enum AttributeType {
    String = "S",
    Number = "N",
    Binary = "B",
    Boolean = "BB",
    Null = "NULL",
    Map = "M",
    List = "L",
    StringSet = "SS",
    NumberSet = "NS",
    BinarySet = "BS"
}
export type KeyInput = {
    AttributeName: string;
    AttributeType: string;
};
export type PrimaryKeyDefinition = {
    pk: KeyInput;
    sk: KeyInput;
};
export type PrimaryKey = {
    pk: string;
    sk?: string;
};
export type TableConstructor = {
    new (client?: DynamoDBClient): Table;
    getName(): string;
    getEntity(instance?: boolean): any;
};
export type TableOptions = {
    name: string;
    primaryKey: PrimaryKey;
    autoCreate?: boolean;
    entity: any;
};
export type ModelConstructor = {
    new (client: DynamoDBClient): Model;
};
export type ModelOptions = {
    table: TableConstructor;
};
export type IDynamoRM = {
    createTables: () => Promise<CreateTableCommandOutput[]>;
    getTable: (tableName: string) => TableConstructor;
    getTables: () => TableConstructor[];
    getModel: (modelName: string) => ModelConstructor;
    getModels: () => ModelConstructor[];
    model: <T>(modelName: string, attributes?: Record<string, any>) => Model & T;
};
export type DynamoRMOptions = {
    tables: Array<any>;
    client: DynamoDBClient;
    models?: Array<any>;
};
//# sourceMappingURL=types.d.ts.map