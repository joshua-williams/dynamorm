import 'reflect-metadata';
import {
  CreateTableCommandOutput,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import Model from "./model";
import {Entity} from "../index";
import {CreateTableOption, DynamormIoC, EntityConstructor, ModelConstructor, TableConstructor} from "./types";
import QueryBuilder from './query';
/**
 * @todo throw error if tables or client is undefined
 */
export class DynamoRM implements DynamormIoC {
  private readonly tables: Array<any>;
  private readonly models: Array<any>;
  private readonly client: DynamoDBClient;
  private readonly queryBuilder: QueryBuilder;

  constructor(DB: Function) {
    this.tables = Reflect.getMetadata('tables', DB)
    this.models = Reflect.getMetadata('models', DB) || []
    this.client = Reflect.getMetadata('client', DB);
    this.queryBuilder = new QueryBuilder(this);
    if (!this.tables || !this.client) {
      throw new Error('A dynamodb client and tables are required')
    }
  }

  query(tableName: string) {
    return this.queryBuilder.table(tableName)
  }
  getClient() {
    return this.client;
  }

  getTables() {
    return this.tables;
  }

  getTable(tableName: string): TableConstructor {
    for (let table of this.tables) {
      // Get table by Class/Constructor name
      if (tableName === table.name) {
        return table;
      }
      // Get table by table name
      if (Reflect.getMetadata('name', table) == tableName) {
        return table;
      }
    }
  }

  public async createTables(option?: CreateTableOption): Promise<CreateTableCommandOutput[]> {
    const results = [];
    for ( let Constructor of this.tables ) {
      const table = new Constructor(this.client);
      if (option) {
        const exists = await table.exists();
        if (option == 'IF_NOT_EXISTS' && exists) continue;
        if (option == 'DROP_IF_EXISTS' && exists) await table.delete();
      }
      const result = await table.create(Constructor)
      results.push(result);
    }
    return results;
  }

  public async deleteTables() {
    for (let Constructor of this.tables ) {
      const table = new Constructor(this.client);
      await table.delete(Constructor);
    }
  }

  getModels(): Array<ModelConstructor> {
    return this.models;
  }

  getModel(modelName: string): ModelConstructor {
    for (let model of this.models) {
       if (modelName == model.name) {
         return model;
       }
    }
  }

  private tableToModel(table: TableConstructor): Model {
    const attributes = table.getEntity(true).getAttributeDefinitions();
    class DynamicModel extends Model {
      protected attributes = attributes
    };
    Reflect.defineMetadata('table', table, DynamicModel);
    Object.assign(DynamicModel.prototype, Entity);
    return new DynamicModel(this.client);
  }

  /**
   * @description Get model instance by table name, table class name or entity class name
   * @param modelName
   * @param attributes
   */
  model<T>(modelName: string, attributes?:Record<string, any>): Model & T {
    let Constructor:ModelConstructor = this.getModel(modelName);
    let model:Model;

    if (Constructor) {
      model = new Constructor(this.client);
    } else {
      for (let table of this.tables) {
        if (modelName == table.getName()) {
          model = this.tableToModel(table);
          break;
        }

        const entityConstructor: EntityConstructor = table.getEntity();
        if (entityConstructor.name == modelName) {
          model = this.tableToModel(table);
          break;
        }
      }
    }
    if (!model) return;
    if (attributes) {
      model.fill(attributes);
    }

    return model as Model&T;
  }
}

export const create = (App: Function): DynamormIoC => {
  return new DynamoRM(App);
}

export default {
  create
}
