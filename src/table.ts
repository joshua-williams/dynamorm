import {CreateTableOption, EntityConstructor, PrimaryKey, PrimaryKeyDefinition} from "./types";
import {
  CreateTableCommand,
  CreateTableCommandInput,
  CreateTableCommandOutput, DeleteTableCommand,
  DeleteTableCommandInput,
  DescribeTableCommand,
  DescribeTableCommandOutput,
  DynamoDBClient,
  KeySchemaElement,
  KeyType,
  ResourceInUseException,
  ResourceNotFoundException
} from "@aws-sdk/client-dynamodb";
import {DynamormException, PrimaryKeyException} from "./exceptions";

export default class Table {
  private name: string;
  private entity: EntityConstructor;
  private primaryKey: PrimaryKey;
  private client: DynamoDBClient;

  constructor(client?: DynamoDBClient) {
    this.name = Reflect.getMetadata('name', this.constructor);
    this.entity = Reflect.getMetadata('entity', this.constructor);
    this.primaryKey = Reflect.getMetadata('primaryKey', this.constructor);

    if (!this.entity) {
      throw new Error(`${this.constructor.name} requires an Entity to be defined. See @Table in dynamorm/decorators`)
    }

    this.client = client ? client : new DynamoDBClient();
  }

  static getName() {
    return Reflect.getMetadata('name', this);
  }

  public getName() {
    return this.name;
  }

  public getEntity<T>(instance = false): T {
    // @ts-ignore
    return instance ? new this.entity() : this.entity;
  }

  static getEntity(instance = false) {
    const Constructor =  Reflect.getMetadata('entity', this);
    return instance ? new Constructor() : Constructor;
  }

  public getPrimaryKeyDefinition(): PrimaryKeyDefinition {
    const attributeDefinitions = this.toAttributeDefinition();
    const primaryKeyDefinition = {
      pk: {
        AttributeName: null,
        AttributeType: null,
      },
      sk: null
    };
    for (let attributeDefinition of attributeDefinitions) {
      const {AttributeName} = attributeDefinition
      if (this.primaryKey.pk === AttributeName) {
        primaryKeyDefinition.pk = attributeDefinition
      } else if (this.primaryKey.sk === AttributeName) {
        primaryKeyDefinition.sk = attributeDefinition;
      }
    }
    return primaryKeyDefinition;
  }

  public getPrimaryKey() {
    return this.primaryKey;
  }

  public toAttributeDefinition() {
    const AttributeDefinitions = [];
    const entity = new this.entity();
    const attributes = entity.getAttributeDefinitions();
    let partitionKeySet = false;
    let sortKeySet = false;

    for (let AttributeName in attributes) {
      const isPartitionKey = AttributeName == this.primaryKey.pk;
      const isSortKey = AttributeName == this.primaryKey.sk;

      if (isPartitionKey || isSortKey) {
        if (isPartitionKey) partitionKeySet = true;
        if (isSortKey) sortKeySet = true;
        AttributeDefinitions.push({
          AttributeName,
          AttributeType: attributes[AttributeName].type
        })
      }
    }
    if (!partitionKeySet) {
      const message = 'Partition key not set on ' + this.constructor.name
      throw new Error(message);
    }
    if (this.primaryKey.sk && !sortKeySet) {
      const message = `Sort key is defined on ${this.constructor.name} but not found in any entities`
      throw new Error(message)
    }

    return AttributeDefinitions;
  }

  public toCreateCommandInput(): CreateTableCommandInput {
    const AttributeDefinitions = this.toAttributeDefinition();
    const ProvisionedThroughput = {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    };
    const KeySchema: Array<KeySchemaElement> = [{
      AttributeName: this.primaryKey.pk,
      KeyType: KeyType.HASH
    }];

    if (this.primaryKey.sk) {
      KeySchema.push({
        AttributeName: this.primaryKey.sk,
        KeyType: KeyType.RANGE,
      })
    }

    return {
      TableName: this.name,
      AttributeDefinitions,
      KeySchema,
      ProvisionedThroughput
    }
  }


  public toInputKey(primaryKey: PrimaryKey) {
    const {pk, sk} = this.getPrimaryKeyDefinition();
    if (!sk && primaryKey.sk) {
      const message = `${this.constructor.name} table does not have a sort key defined but you are attempting to do a look by ${primaryKey.sk} `
      throw new PrimaryKeyException(message)
    }
    const Key = {
      [pk.AttributeName]: {
        [pk.AttributeType]: primaryKey.pk
      }
    }

    if (primaryKey.sk) {
      Key[sk.AttributeName] = {
        [sk.AttributeType]: primaryKey.sk
      }
    }
    return Key;
  }

  public async exists(): Promise<boolean> {
    let tableInfo: DescribeTableCommandOutput;
    try {
      tableInfo = await this.describe();
    } catch (e) {
      return true;
    }
    return !!tableInfo;
  }

  public async create(option?: CreateTableOption) {
    if (option) {
      const tableDescription = await this.describe();
      if (option === 'IF_NOT_EXISTS' && tableDescription) return;
    }
    const commandInput = this.toCreateCommandInput();
    const command = new CreateTableCommand(commandInput);
    let message = `Failed to save table ${this.constructor.name}`;
    let response: CreateTableCommandOutput;

    try {
      response = await this.client.send(command);
    } catch ( e ) {

      switch ( e.constructor ) {
        case ResourceInUseException:
          message = `Table already exists "${this.constructor.name}"`
          break;
      }
      throw new Error(message);
    }
    return response;
  }

  public async delete() {
    const input: DeleteTableCommandInput = {
      TableName: this.getName()
    }
    const command: DeleteTableCommand = new DeleteTableCommand(input);
    try {
      await this.client.send(command);
    } catch (e) {
      throw new DynamormException('Failed to delete table ' + this.getName());
    }
  }
  /**
   * @description Gets table formation. If table has not been created will return undefined
   */
  public async describe(): Promise<DescribeTableCommandOutput> {
    const command = new DescribeTableCommand({
      TableName: this.name
    });
    let response: DescribeTableCommandOutput;
    try {
      response = await this.client.send(command);
    } catch (e) {
      switch (e.constructor) {
        case ResourceNotFoundException:
          return;
        default:
          throw new DynamormException(e.message);
      }
    }
    return response;
  }
}
