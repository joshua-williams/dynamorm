import 'dotenv/config'
import {AuthorTable, CookbookTable, RecipeTable} from "./tables";
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamormFactory, dynamorm} from "../../index";
import {AuthorModel, CookbookModel} from "./models";

const configuration = process.env.ENVIRONMENT == 'local' ? {endpoint: "http://localhost:8000"} : {}

@dynamorm({
  client: new DynamoDBClient(configuration),
  tables: [AuthorTable, CookbookTable, RecipeTable],
  models: [CookbookModel, AuthorModel]
})
export class DB {}

export default DynamormFactory.create(DB)
