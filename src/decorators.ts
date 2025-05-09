import 'reflect-metadata'
import {DynamoRMOptions, ModelOptions, TableOptions} from "./types";
import {AttributeType} from "./types";
import DynamoRM from "./dynamorm";


export function table(options:TableOptions) {
  return function(constructor) {
    Reflect.defineMetadata("name", options.name, constructor);
    Reflect.defineMetadata("primaryKey", options.primaryKey, constructor);
    Reflect.defineMetadata("entity", options.entity, constructor);
  }
}

export function model(options: ModelOptions) {
  return function (constructor) {
    Reflect.defineMetadata('table', options.table, constructor);
  }
}

export function dynamorm(options:DynamoRMOptions) {
  return function(constructor) {
    Reflect.defineMetadata("client", options.client, constructor);
    Reflect.defineMetadata("tables", options.tables, constructor);
    Reflect.defineMetadata("models", options.models, constructor);
  }
}

export function attribute(type: AttributeType = AttributeType.String, required: boolean = false) {
  return function (constructor, key) {
    let attributes = Reflect.getMetadata('attributes', constructor);
    if (attributes) {
      attributes[key] = {type, required}
    } else {
      attributes = {
        [key]: {type, required}
      };
    }
    Reflect.defineMetadata('attributes', attributes , constructor)
  }
}

export function Entity(constructor) {
  Reflect.defineMetadata('entity', constructor.name, constructor)
}
