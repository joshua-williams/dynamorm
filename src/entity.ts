import {AttributeDefinitions} from "./types";

class Entity {
  public name: string;

  public getAttributeDefinitions(): AttributeDefinitions {
    const properties = Reflect.ownKeys(this);
    const attributes = Reflect.getMetadata('attributes', this);

    const reducer = (attributeDefinitions, name) => {
      if (!attributes.hasOwnProperty(name)) return attributeDefinitions;

      const { type, required } = attributes[name];
      attributeDefinitions[name] = {type, required};
      return attributeDefinitions;
    }
    return properties.reduce(reducer, {});
  }

}
export default Entity
