import { AttributeDefinition } from './types';

export const attribute = (attribute: AttributeDefinition, value: any) => {
  switch (attribute.type.toLowerCase()) {
    case 's':
      if ((typeof value) != 'string') return new TypeError('string')
      break;
    case 'ss':
      if (! (value instanceof Array)) return new TypeError('string set');
      for (let v of value) {
        if ((typeof v) !== 'string') return new TypeError('string set');
      }
      break
    case 'n':
      if ((typeof value) !== 'number') return new TypeError('number');
      break
    case 'ns':
      if (! (value instanceof Array)) return new TypeError('number set');
      for (let v of value) {
        if ((typeof v) !== 'number') return new TypeError('number set');
      }
      break
    case 'bb':
      if (typeof value != 'boolean') return new TypeError('boolean');
      break;

    case 'map':
      // @ts-ignore
      if (typeof value != 'object') return new TypeError('object');
      break;

    case 'l':
      if (!(value instanceof Array)) return new TypeError('array');
      const validTypes = ['string', 'number'];

      for (let v of value) {
        if (!validTypes.includes(typeof v)) return new TypeError('primitive')
      }
      break;
  }
  return true;
}
