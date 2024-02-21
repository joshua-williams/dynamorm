import db from "./fixtures/db";
import {Entity, Table} from "../index";
import {EntityConstructor} from "../src/types";

describe('table', () => {
  const TableConstructor = db.getTable('CookbookTable');
  let table: Table;

  beforeEach(() => {
    table = new TableConstructor();

  })

  it('should get attribute definitions', () => {
    const expectedAttributeDefinitions = [
      { AttributeName: 'title', AttributeType: 'S' },
      { AttributeName: 'author', AttributeType: 'S' }
    ]
    const attributeDefinitions = table.toAttributeDefinition();
    expect(attributeDefinitions).toMatchObject(expectedAttributeDefinitions);
  })

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
