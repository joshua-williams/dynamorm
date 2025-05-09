import {model, Model} from "../../index";
import {AuthorTable, CookbookTable} from "./tables";

@model({table: CookbookTable})
export class CookbookModel extends Model {}

@model({table: AuthorTable})
export class AuthorModel extends Model {

}
