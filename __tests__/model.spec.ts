import {CookbookModel} from "./fixtures/models";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import Model from "../src/model";

const config = {endpoint: 'http://localhost:8000'};
const client = new DynamoDBClient(config);

describe('model', () => {
  let model: any;

  beforeEach (() => {
    model = new CookbookModel(client);
  });

  it ('should set attribute with setter', () => {
    model.title = 'Southern Cooking'
    model.image = ['http://pathtoimage.com'];
    model.reviews = 5;
    expect(model.title).toEqual('Southern Cooking');
  });

  describe('validation', () => {
    let fillData;
    beforeEach(() => {
      fillData = {
        title: 'Southern Cooking',
        description: 'Another southern cookbook with gravy all over everything',
        image: ['http://pathtoimage.com/logo.png'],
        author: 'Joshua D. Williams',
        reviews: 5,
        ratings: [3,8,6,9,8,3,7,5]
      }
    })
    describe('Primary Key Validation', () => {
      it('should validate all attributes', () => {
        model.fill(fillData);
        const result = model.validate();
        expect(result.valid).toBe(true);
      })
      it('should fail if partition key is not set', () => {
        fillData.title = undefined;
        model.fill(fillData);
        const result = model.validate();
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('title');
      })
      it('should fail if sort key is not set', () => {
        fillData.author = undefined;
        model.fill(fillData)
        const result = model.validate();
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('author');
      })
      it('should fail if required field is not set', () => {
        fillData.image = undefined;
        model.fill(fillData);
        const result = model.validate();
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('image')
      })
    })

    describe('Data Type Validation', () => {
      it('should fail if type is not string', () => {
        fillData.title = 12345;
        model.fill(fillData);
        const {valid, errors} = model.validate();
        expect(valid).toBe(false);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('title');
      })
      it('should fail if type is not string set', () => {
        fillData.image = 'http://pathtoimage.com/logo.png';
        model.fill(fillData)
        const {valid, errors} = model.validate();
        expect(valid).toBe(false);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('image');
      })
      it('should fail if type is not number', () => {
        fillData.reviews = '5'
        model.fill(fillData);
        const {valid, errors} = model.validate();
        expect(valid).toBe(false);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('number');
      })

      it('should fail if type is not number set', () => {
        fillData.ratings = [10, 8, 5, 9, 7, '7']
        model.fill(fillData);
        const {valid, errors} = model.validate();
        expect(valid).toBe(false);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('number');
      })

      it('should fail if list type contains non-primitive values', () => {
        fillData.comments = ['loved it', {}, 3, 'very good', 6, 7, 'it sucked'];
        model.fill(fillData);
        const result = model.validate();
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('comments')
      })
    })
    describe('setter validation', () => {

      it ('should fail string validation', () => {
        const expectedFailure = () => model.title = [];
        expect(expectedFailure).toThrow(TypeError)
      });

      it ('should fail string set validation', () => {
        const expectedFailure = () => model.image = 'http://pathtoimage.com';
        expect(expectedFailure).toThrow(TypeError)
      });

      it ('should fail number validation', () => {
        const expectedFailure = () => model.reviews = '70';
        expect(expectedFailure).toThrow(TypeError)
      });

      it ('should fail number set validation', () => {
        const expectedFailure = () => model.reviews = ['70'];
        expect(expectedFailure).toThrow(TypeError)
      })

      it('should fail map validation', () => {
        const expectedFailure = () => model.reviews = ['70'];
        expect(expectedFailure).toThrow(TypeError)
      })
    })

  })

  describe('save', () => {
    it('should save', async () => {
      model.fill({
        title: "Southern Savories",
        author: 'dev@studiowebfx.com',
        image: ['logo.png']
      });
      const result = await model.save();
      expect(result).toHaveProperty('$metadata.httpStatusCode', 200);
    })
  })

  describe('find', () => {
    it('should get item by primary key', async () => {
      const result = await model.find('Southern Savories','dev@studiowebfx.com');
      expect(result).toBeInstanceOf(Model)
      expect(result.title).toEqual('Southern Savories')
      expect(result.author).toEqual('dev@studiowebfx.com')
    })
  })

  describe('delete', () => {
    it('should delete item by primary key', async () => {
      await model.fill({
        title: 'Southern Savories',
        author: 'dev@studiowebfx.com',
        image: ['image.png']
      }).save();
      const result = await model.delete('Southern Savories','dev@studiowebfx.com');
      expect(result).toBe(true);
    })
  })

  describe('update', () => {
    it('should update item', async () => {
      model.fill({
        title: 'Southern Crunch',
        author: 'dev@studiowebfx.com',
        description: 'Another Cookbook',
        image: ["logo.png", "logo2.png"]
      })
      const updateModel = async () => await model.update();
      expect(updateModel).not.toThrow()
    })
  })
})
