import { AttributeDefinitions, Attributes, PrimaryKey } from "./types";
import { DynamoDBClient, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import Table from "./table";
import Entity from "./entity";
declare class Model {
    private client;
    name: string;
    protected table: Table;
    protected entity: Entity;
    protected attributes: AttributeDefinitions;
    readonly primaryKey: PrimaryKey;
    constructor(client: DynamoDBClient);
    fill(attribute: Attributes | string, value?: any): void;
    /**
     * @description Sets named attribute value
     * @param attributeName
     * @param value
     */
    set(attributeName: string, value: any): void;
    /**
     * @description Sets named attribute value. If attribute not set and defaultValue is not provided an error is thrown
     * @param attributeName
     */
    get(attributeName: string): any;
    /**
     * @description Gets PrimaryKey including values
     */
    getPrimaryKey(): PrimaryKey;
    getAttributes(): AttributeDefinitions;
    getAttributeValues(omitUndefined?: boolean): {};
    static getEntity(): any;
    getEntity(instance?: boolean): unknown;
    save(): Promise<PutItemCommandOutput>;
    fresh(): Promise<boolean>;
    find(pk?: string, sk?: string): Promise<Model>;
    /**
     * @description Delete an item by primary key
     * @param pk - Partition key
     * @param sk - (optional) Sort Key
     * @return boolean - True if an item was deleted. False if primary key did not match an item and nothing was deleted
     */
    delete(pk?: string, sk?: string): Promise<any>;
    clear(): void;
    private validatePrimaryKey;
    validate(): {
        valid: boolean;
        errors: string[];
    };
    private validateAttribute;
    private toPutCommandInput;
}
export default Model;
//# sourceMappingURL=model.d.ts.map