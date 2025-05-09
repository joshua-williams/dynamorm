import {AttributeDefinitions} from "./types";

class Entity {

  public getAttributeDefinitions(): AttributeDefinitions {
    const properties = Reflect.ownKeys(this);
    const attributes = Reflect.getMetadata('attributes', this);
    if (!attributes) return;
    const reducer = (attributeDefinitions, name) => {
      if (!attributes.hasOwnProperty(name)) return attributeDefinitions;
      const { type, required } = attributes[name];
      attributeDefinitions[name] = {type, required, value: this[name]};
      return attributeDefinitions;
    }
    return properties.reduce(reducer, {});
  }
}
export default Entity
