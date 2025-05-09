import {attribute, Entity} from "../../index";
import {AttributeRequired, AttributeType} from "../../src/types";

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

export class CookbookEntity extends Entity {
  @attribute()
  private title = 'Southern Cornbread';

  @attribute()
  private summary;

  @attribute()
  private description;

  @attribute()
  private author;

  @attribute(AttributeType.StringSet, AttributeRequired)
  private image;

  @attribute(AttributeType.Number)
  private reviews;

  @attribute(AttributeType.NumberSet)
  private ratings: number[];

  @attribute(AttributeType.List)
  private comments: string|number[];
}

export class RecipeEntity extends Entity {
  @attribute()
  private cookbook;

  @attribute()
  private title;

  @attribute()
  private subject;

  @attribute()
  private body;

  @attribute()
  private user;
}
