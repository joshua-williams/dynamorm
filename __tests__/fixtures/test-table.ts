import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {attribute, dynamorm, DynamormFactory, Entity, table as TableDecorator, Table} from '../../index';

export const client = new DynamoDBClient({endpoint: 'http://localhost:8000'});

export class TestEntity extends Entity {
  @attribute()
  pk: string;
  @attribute()
  sk: string;
}

@TableDecorator({
  name: 'TestTable',
  primaryKey: {pk: 'pk', sk: 'sk'},
  entity: TestEntity
})
export class TestTable extends Table {}

@dynamorm({
  tables: [TestTable],
  client
})
class DB {}

export const db = DynamormFactory.create(DB);
