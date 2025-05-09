import {AttributeDefinitions, Attributes, PrimaryKey, PrimaryKeyDefinition} from './types';

export const toInputKey = (primaryKey: PrimaryKey, primaryKeyDefinition: PrimaryKeyDefinition) => {
  const {pk, sk} = primaryKeyDefinition;
  const Key = {
    [pk.AttributeName]: {
      [pk.AttributeType]: primaryKey.pk
    }
  }

  if (primaryKey.sk) {
    Key[sk.AttributeName] = {
      [sk.AttributeType]: primaryKey.sk
    }
  }
  return Key;
}

export const toExpressionAttributeNamePlaceholder = (attribute) => {
  let placeholder;
  try {
    placeholder = '#' + attribute.replace(/\s+/g, '_').toLowerCase();
  } catch (e) {
    console.log('problem with ' + attribute, e.message)
  }
  return placeholder;
}

export const toExpressionAttributeValuePlaceholder = (attribute) => ':' + attribute.replace(/\s+/g, '_').toLowerCase();

export const toExpressionAttributeNames = (attributes: Attributes) => {
  return Object.keys(attributes).reduce((ExpressionAttributeNames, attribute) => {
    const placeholder = toExpressionAttributeNamePlaceholder(attribute);
    ExpressionAttributeNames[placeholder] = attribute;
    return ExpressionAttributeNames;
  }, {})
}

export const toExpressionAttributeValues = (attributes: Attributes, attributeDefinitions: AttributeDefinitions) => {
  return Object.keys(attributes).reduce((ExpressionAttributeValues, attribute) => {
    const placeholder = toExpressionAttributeValuePlaceholder(attribute);
    const attributeType = attributeDefinitions[attribute].type;
    ExpressionAttributeValues[placeholder] = {
      [attributeType]: attributes[attribute]
    }
    return ExpressionAttributeValues;
  }, {})

}
