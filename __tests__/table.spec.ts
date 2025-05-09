import db from "./fixtures/db";
import { Table } from "../index";
import { CookbookTable } from "./fixtures/tables";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

describe('table', () => {
  const config = {endpoint: 'http://localhost:8000'};
  const client = new DynamoDBClient(config);
  const CookbookTableConstructor = db.getTable('CookbookTable');
  let table: Table

  beforeEach(() => {
    table = new CookbookTableConstructor(client);

  })
  describe('attribute definitions', () => {
    it('should get attribute definitions from factory table', () => {
      const expectedAttributeDefinitions = [
        { AttributeName: 'title', AttributeType: 'S' },
        { AttributeName: 'author', AttributeType: 'S' }
      ]
      const attributeDefinitions = table.toAttributeDefinition();
      expect(attributeDefinitions).toMatchObject(expectedAttributeDefinitions);
    })

    it('should get attribute definitions from table instance', () => {
      let t = new CookbookTable()
      const expectedAttributeDefinitions = [
        { AttributeName: 'title', AttributeType: 'S' },
        { AttributeName: 'author', AttributeType: 'S' }
      ]
      const attributeDefinitions = t.toAttributeDefinition();
      expect(attributeDefinitions).toMatchObject(expectedAttributeDefinitions);
    })
  })

  describe('Create Table', () => {

    it('should output CreateCommandInput', () => {
      const expectedCommandInput = {
        TableName: 'Cookbooks',
        AttributeDefinitions: [
          { AttributeName: 'title', AttributeType: 'S' },
          { AttributeName: 'author', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'title', KeyType: 'HASH' },
          { AttributeName: 'author', KeyType: 'RANGE' }
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      }
      const createCommandInput = table.toCreateCommandInput();
      expect(createCommandInput).toMatchObject(expectedCommandInput)
    })


  })

  it('should getPrimaryKeyDefinition', () => {
    const primaryKeyDefinition = table.getPrimaryKeyDefinition();
    const expectedDefinition = {
      pk: { AttributeName: 'title', AttributeType: 'S' },
      sk: { AttributeName: 'author', AttributeType: 'S' }
    }
    expect(expectedDefinition).toMatchObject(primaryKeyDefinition)
  })

  it('should get information about existing table', async () => {
    table = new CookbookTable(client);
    const tableInfo = await table.describe();
    expect(tableInfo).toHaveProperty('Table.TableName', 'Cookbooks')
  })

  it('should return undefined when describing non-existing table', async () => {
    table = new CookbookTable(client);
    // @ts-ignore
    table.name = 'noname';
    const tableInfo = await table.describe();
    expect(tableInfo).toBe(undefined);
  })
})
