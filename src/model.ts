import 'reflect-metadata';
import {
  AttributeDefinition,
  AttributeDefinitions,
  Attributes,
  ModelConstructor,
  PrimaryKey,
} from "./types";
import {
  DeleteItemCommand, DeleteItemCommandOutput,
  DeleteItemInput,
  DynamoDBClient, GetItemCommand, GetItemCommandInput, GetItemCommandOutput,
  PutItemCommand,
  PutItemCommandOutput,
  ResourceNotFoundException, UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import {
  DynamormException,
  PrimaryKeyException,
  ServiceUnavailableException,
  TableNotFoundException, ValidationError
} from "./exceptions";
import Table from "./table";
import Entity from "./entity";
import {
  toExpressionAttributeNamePlaceholder,
  toExpressionAttributeNames, toExpressionAttributeValuePlaceholder,
  toExpressionAttributeValues,
  toInputKey
} from './command-input-converter';
import {UpdateCommandInput} from '@aws-sdk/lib-dynamodb';

class Model {
  protected table: Table;
  protected entity: Entity;
  protected attributes: AttributeDefinitions = {};
  public readonly primaryKey: PrimaryKey;

  constructor( private client: DynamoDBClient ) {
    this.table = new (Reflect.getMetadata('table', this.constructor));
    this.entity = this.table.getEntity(true);
    this.attributes = this.entity.getAttributeDefinitions();
    this.primaryKey = this.table.getPrimaryKey();

    for (let attribute in this.attributes) {
      Object.defineProperty(this, attribute, {
        get() {
          return this.attributes[attribute].value
        },
        set(value) {
          const result = this.validateAttribute(this.attributes[attribute], value);
          if (result instanceof TypeError) {
            result.message = `${attribute} must be a ${result.message} on ${this.constructor.name}`
            throw result;
          }
          this.attributes[attribute].value = value
        }
      });
    }
  }

  public fill(attribute: Attributes | string, value?:any) {
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
    return this;
  }

  /**
   * @description Sets named attribute value
   * @param attributeName
   * @param value
   */
  public set(attributeName: string, value: any) {
    if (this.attributes.hasOwnProperty(attributeName)) {
      this.attributes[attributeName].value = value;
    }
    return this;
  }

  /**
   * @description Sets named attribute value. If attribute not set and defaultValue is not provided an error is thrown
   * @param attributeName
   */
  public get(attributeName: string) {
    if (this.attributes.hasOwnProperty(attributeName)) {
      return this.attributes[attributeName].value;
    }
    throw new Error(`Attribute not found: ${attributeName}`)
  }

  /**
   * @description Gets PrimaryKey including values
   */
  public getPrimaryKey(): PrimaryKey {
    const primaryKeyDefinition = this.table.getPrimaryKeyDefinition();
    const primaryKey: PrimaryKey = {
      pk: this.attributes[primaryKeyDefinition.pk.AttributeName].value,
      sk: undefined
    }
    if (primaryKeyDefinition.sk) {
      primaryKey.sk = this.attributes[primaryKeyDefinition.sk.AttributeName].value;
    }
    return primaryKey;
  }

  public getAttributes() {
    return this.attributes;
  }

  public getAttributeValues(omitUndefined: boolean = true, omitPrimaryKey = false) {
    return Object.keys(this.attributes).reduce((attributes, attribute) => {
      if (attribute == this.table.getPrimaryKey().pk && omitPrimaryKey) return attributes;
      if (attribute == this.table.getPrimaryKey().sk && omitPrimaryKey) return attributes;
      const value = this.attributes[attribute].value;
      if (value == undefined && omitUndefined) return attributes;
      attributes[attribute] = this.attributes[attribute].value;
      return attributes;
    }, {})
  }

  static getEntity() {
    return Reflect.getMetadata('entity', this);
  }

  public getEntity(instance: boolean = false) {
    return this.table.getEntity(instance);
  }

  public async save(): Promise<PutItemCommandOutput> {
    const { valid, errors} = this.validate();
    if (!valid)  throw new ValidationError(errors);

    const input = this.toPutCommandInput();
    const command = new PutItemCommand(input);
    let result: PutItemCommandOutput;
    try {
      result = await this.client.send(command);
    } catch ( e ) {
      let message = `Failed to save dynamo model ${this.constructor.name}. ${e.message}`;

      switch ( e.constructor ) {
        case ResourceNotFoundException:
          const { statusCode } = e.$response;

          switch( statusCode ) {
            case 400:
              message = `dynamodb table does not exist "${this.table.getName()}"`
              break;
          }
          throw new TableNotFoundException(message);

        default:
          throw new ServiceUnavailableException(message);
      }
    }
    return result;
  }

  public async fresh(): Promise<boolean> {
    const {valid, errors} = this.validatePrimaryKey();
    if (!valid) {
      throw new PrimaryKeyException(errors[0]);
    }
    const model = await this.find();
    if (model === undefined) return false;
    for (let attributeName in this.attributes) {
      if (model.attributes.hasOwnProperty(attributeName)) {
        this.attributes[attributeName].value = model.attributes[attributeName].value
      }
    }
    return true;
  }

  public async find(pk?: string, sk?: string): Promise<Model>{
    const primaryKeyDefinition = this.table.getPrimaryKeyDefinition();
    if (primaryKeyDefinition.sk && !sk) {
      throw new PrimaryKeyException(`Failed to fetch item. Primary key requires partition key and sort key on ${this.table.constructor.name}`)
    }
    const primaryKeyValues = this.getPrimaryKey();
    if (pk) primaryKeyValues.pk = pk;
    if (sk) primaryKeyValues.sk = sk;

    const input: GetItemCommandInput = {
      TableName: this.table.getName(),
      // @ts-ignore
      Key: this.table.toInputKey(primaryKeyValues)
    }
    const command = new GetItemCommand(input);
    let result: GetItemCommandOutput;
    try {
      result = await this.client.send(command);
      if (!result.hasOwnProperty('Item')) return;
      const attributes = {};
      for (let attribute in result.Item) {
        attributes[attribute] = Object.values(result.Item[attribute])[0];
      }
      const modelConstructor = this.constructor as ModelConstructor;
      const model = new modelConstructor(this.client);
      model.fill(attributes);
      return model;
    } catch (e) {
      throw new DynamormException(e.message);
    }
  }

  /**
   * @description Delete an item by primary key
   * @param pk - Partition key
   * @param sk - (optional) Sort Key
   * @return boolean - True if an item was deleted. False if primary key did not match an item and nothing was deleted
   */
  public async delete(pk?: string, sk?: string) {
    const primaryKey = {
      pk: pk || this.table.getPrimaryKey().pk,
      sk: sk || this.table.getPrimaryKey().sk,
    }
    const primaryKeyDefinition = this.table.getPrimaryKeyDefinition();
    if (primaryKeyDefinition.sk && !sk) {
      throw new PrimaryKeyException(`Failed to delete item. Primary key requires partition key and sort key on ${this.table.constructor.name}`)
    }
    const input: DeleteItemInput = {
      TableName: this.table.getName(),
      // @ts-ignore
      Key: this.table.toInputKey(primaryKey),
      ReturnValues: "ALL_OLD"
    }
    const command = new DeleteItemCommand(input);
    let result:DeleteItemCommandOutput;
    try {
      result = await this.client.send(command);
      return result.hasOwnProperty('Attributes');
    } catch (e) {
      throw new DynamormException('failed to delete item');
    }
  }

  public async update(dto?: Record<string, any>) {
    if (dto) this.fill(dto);
    const { valid, errors} = this.validate();
    if (!valid)  throw new ValidationError(errors);
    const input = this.toUpdateCommandInput();
    const command = new UpdateItemCommand(input);
    try {
      await this.client.send(command);
    } catch (e) {
      throw new DynamormException('Failed to update item')
    }
  }

  public clear() {
    for (let attributeName in this.attributes) {
      this.attributes[attributeName].value = undefined;
    }
  }

  private validatePrimaryKey() {
    const primaryKey = this.table.getPrimaryKey();
    const className = this.constructor.name === 'DynamicModel' ? this.entity.constructor.name : this.constructor.name;
    const errors = [];
    // Validate partition key defined on table is also defined as attribute in respective entity
    if (!this.attributes.hasOwnProperty(primaryKey.pk)) {
      errors.push(`Partition key "${primaryKey.pk}" is not defined in ${className}`)
    }
    // Validate partition key defined on table is set in respective entity
    if (this.attributes[primaryKey.pk].value === undefined) {
      errors.push(`Partition key "${primaryKey.pk}" is not set in ${className}`)
    }
    // Validate sort key defined on table is also defined as attribute in respective entity
    if (primaryKey.sk && !this.attributes.hasOwnProperty(primaryKey.sk)) {
      errors.push(`Sort key "${primaryKey.sk}" is not defined in ${className}`)
    }
    // Validate sort key defined on table is set in respective entity
    if (primaryKey.sk && this.attributes[primaryKey.sk].value === undefined) {
      errors.push(`Sort key "${primaryKey.sk}" is not set in ${this.constructor.name}`)
    }
    return {
      valid: !errors.length,
      errors
    }
  }

  public validate(): {valid: boolean, errors: string[]} {
    const errors = [];

    const result = this.validatePrimaryKey();
    if (!result.valid) errors.push(...result.errors);

    for (let attributeName in this.attributes) {
      const attribute = this.attributes[attributeName];
      // Validate required attribute is set
      if (attribute.required && attribute.value === undefined) {
        errors.push(`"${attributeName}" is required on ${this.table.getName()} table`);
        continue;
      }
      // Skip validation of optional attribute that has not been set
      if (!attribute.required && attribute.value === undefined) continue;

      const result = this.validateAttribute(attribute, attribute.value);
      if (result instanceof TypeError) {
        errors.push(`TypeError: "${attributeName}" attribute should be ${result.message} in ${this.constructor.name}`);
      }
    }
    return {
      valid: !errors.length,
      errors
    }
  }

  private validateAttribute(attribute: AttributeDefinition, value: any) {
    switch (attribute.type.toLowerCase()) {
      case 's':
        if ((typeof value) != 'string') return new TypeError('string')
        break;
      case 'ss':
        if (! (value instanceof Array)) return new TypeError('string set');
        for (let v of value) {
          if ((typeof v) !== 'string') return new TypeError('string set');
        }
        break
      case 'n':
        if ((typeof value) !== 'number') return new TypeError('number');
        break
      case 'ns':
        if (! (value instanceof Array)) return new TypeError('number set');
        for (let v of value) {
          if ((typeof v) !== 'number') return new TypeError('number set');
        }
        break
      case 'bb':
        if (typeof value != 'boolean') return new TypeError('boolean');
        break;

      case 'map':
        // @ts-ignore
        if (typeof value != 'object') return new TypeError('object');
        break;

      case 'l':
        if (!(value instanceof Array)) return new TypeError('array');
        const validTypes = ['string', 'number'];

        for (let v of value) {
          if (!validTypes.includes(typeof v)) return new TypeError('primitive')
        }
        break;
    }
    return true;
  }

  private toPutCommandInput() {
    const input = {
      TableName: this.table.getName(),
      Item: {}
    };
    for (let name in this.attributes) {
      const attribute = this.attributes[name];
      if (attribute.value === undefined) continue;
      input.Item[name] = {
        [attribute.type]: attribute.value
      }
    }
    return input;
  }

  private toUpdateCommandInput(): UpdateCommandInput {
    const { valid, errors } = this.validatePrimaryKey();
    if (!valid) throw new PrimaryKeyException(errors);
    const primaryKey = this.getPrimaryKey();
    const primaryKeyDefinitions = this.table.getPrimaryKeyDefinition();
    const attributes = this.getAttributeValues(true, true);
    // primary key values can not be updated so they are removed before the following UpdateExpression is generated
    delete attributes[this.table.getPrimaryKey().pk];
    if (primaryKey.sk) delete attributes[this.table.getPrimaryKey().sk]

    let UpdateExpression = 'SET ';

    for (let attribute in attributes) {
      const namePlaceholder = toExpressionAttributeNamePlaceholder(attribute);
      const valuePlaceholder = toExpressionAttributeValuePlaceholder(attribute);
      UpdateExpression += `${namePlaceholder} = ${valuePlaceholder}, `;
    }

    UpdateExpression = UpdateExpression.substring(0, UpdateExpression.length - 2);
    const attributeDefinitions = this.entity.getAttributeDefinitions();

    const input: UpdateCommandInput = {
      ExpressionAttributeNames: toExpressionAttributeNames(attributes),
      ExpressionAttributeValues: toExpressionAttributeValues(attributes, attributeDefinitions),
      Key: toInputKey(primaryKey, primaryKeyDefinitions),
      ReturnValues: 'NONE',
      TableName: this.table.getName(),
      UpdateExpression
    }
    return input;
  }
}

export default Model
