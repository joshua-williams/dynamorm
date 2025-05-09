# DynamORM
DynamORM is an object-relational mapper (ORM) for interacting with DynamoDB
written in Typescript.

_Requires tsconfig target set to ESNext_

### Define an Entity
An entity defines all attributes associated with a single DynamoDB table.

`entities.ts`

```typescript
import {Entity, attribute} from "dynamorm";

export class AuthorEntity extends Entity {
  @attribute()
  private firstName;

  @attribute()
  private lastName;

  @attribute()
  private email;

  @attribute()
  private image;

  @attribute()
  private about;

  @attribute()
  private socialMediaLinks;
}
```
The `@attribute` decorator accepts two parameters
- type: AttributeType - default AttributeType.String
- required: boolean - default false

```typescript
import {AttributeType, attribute} from "dynamorm";
import {AttributeRequired} from "./types";

...
@attribute(AttributeType.Number, AttributeRequired)
private age;
...
```


### Define a Table
This table uses `email` as the partition key with no sort key.

`tables.ts`
```typescript
import {Table, table} from "dynamorm";

@table({
  name: 'Authors',
  primaryKey: {pk: 'email'},
  entities: [AuthorEntity]
})
export class AuthorTable extends Table {}
```

### Bootstrap DynamORM

DynamORM wraps your database code in an object that exposes an easy to use api. This is the entry point for interacting
with DynamoDB service.

`db.ts`

```typescript
import {Dynamorm, dynamorm} from "dynamorm"

dynamorm({
  client: new DynamoDBClient(),
  tables: [AuthorTable]
})
class Db {}

const db = Dynamorm.create(Db)

export default db
```

### Save To Database
Entities are automatically converted to 
`index.ts`

```typescript
import db from './db'

const model = db.model('AuthorEntity');
model.set('fistName', 'Jack')
model.set('lastName', 'black')
model.set('email', 'jack@black.com')
model.save()
.catch(() => {
  console.log("Houston, there's a problem!")
})
```

### Get Item By Primary Key
```typescript
...
const user = db.model('AuthorEntity');
const jack = user.find('jack@black.com')
```

### Delete Item
```typescript
...
const jack = db.model('AuthorEntity');
jack.set('email', 'jack@black.com')
jack.delete();
```

### Testing
The test suite relies on [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html) 
as a [Docker image](https://hub.docker.com/r/amazon/dynamodb-local) so Docker must be installed and running.

```bash
# start local dynamodb
$ npm run start

# run all tests
$ npm run test

# run tests in watch mode
$ npm run test: watch

```
