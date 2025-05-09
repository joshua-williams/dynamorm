import { PrimaryKey, PrimaryKeyDefinition } from "./types";
import { CreateTableCommandInput, CreateTableCommandOutput, DescribeTableCommandOutput, DynamoDBClient } from "@aws-sdk/client-dynamodb";
export default class Table {
    private name;
    private entity;
    private primaryKey;
    private client;
    constructor(client?: DynamoDBClient);
    static getName(): any;
    getName(): string;
    getEntity<T>(instance?: boolean): T;
    static getEntity(instance?: boolean): any;
    getPrimaryKeyDefinition(): PrimaryKeyDefinition;
    getPrimaryKey(): PrimaryKey;
    toAttributeDefinition(): any[];
    toCreateCommandInput(): CreateTableCommandInput;
    toInputKey(primaryKey: PrimaryKey): {
        [x: string]: {
            [x: string]: string;
        };
    };
    create(): Promise<CreateTableCommandOutput>;
    /**
     * @description Gets table formation. If table has not been created will return undefined
     */
    describe(): Promise<DescribeTableCommandOutput>;
}
//# sourceMappingURL=table.d.ts.map