import Entity from "./entity";
import Table from "./table";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import Model from "./model";

export interface EntityAttributes extends Record<string|symbol, any> {}

export type AttributeDefinition = {
  type: string,
  required?: boolean,
};

export type AttributeDefinitions = {
  [key: string]: AttributeDefinition
}

export const AttributeRequired = true;

export enum AttributeType {
  String = 'S',
  Number = 'N',
  Binary = 'B',
  Boolean = 'BB',
  Null = 'NULL',
  Map = 'M',
  List  = 'L',
  StringSet = 'SS',
  NumberSet = 'NS',
  BinarySet = 'BS',
}

export type PrimaryKey = {
  pk: string,
  sk?: string,
}

export type TableOptions = {
  name: string,
  primaryKey: PrimaryKey
  autoCreate?: boolean,
  entities: Array<Entity>
}

export type ModelOptions = {
  entities: Array<Entity>
}

export type DynamoRM = {

}
export type DynamoRMOptions = {
  tables: Array<any>,
  client: DynamoDBClient,
  models?: Array<any>
}
