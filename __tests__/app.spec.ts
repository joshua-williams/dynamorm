import 'reflect-metadata';
import app from './fixtures/app';
import {CookbookModel} from "./fixtures/models";
import { Model } from '../index'

describe('app', () => {

  describe('getters', () => {
    it('should get tables', () =>{
      const tables = app.getTables();
      expect(tables).toBeInstanceOf(Array);
      expect(tables).toHaveLength(3);
    })

    it('should get table by name', () => {
      const table = app.getTable('CookbookTable');
      expect(table).toHaveProperty('name', 'CookbookTable')
    })

    it('should get models', () => {
      const models = app.getModels();
      expect(models).toBeInstanceOf(Array);
      expect(models).toHaveLength(2);
    })

    it('should get model by name', () => {
      const model = app.getModel('CookbookModel');
      expect(model).toHaveProperty('name', 'CookbookModel')
    })
  })

  describe('factories', () => {
    it('should make model instance', () => {
      const model = app.model('CookbookModel');
      expect(model).toBeInstanceOf(CookbookModel)
    })
    it('should make entity into model instance', () => {
      const model = app.model('CookbookEntity');
      const attributes = model.getAttributes();
      const expectedAttributes = {
        title: undefined,
        summary: undefined,
        description: undefined,
        author: undefined,
        image: undefined
      }
      expect(attributes).toMatchObject(expectedAttributes);
      expect(model).toBeInstanceOf(Model)
    })
  })

  describe('model attributes', () => {
    let model:Model;
    beforeEach(() => {
      model = app.model('CookbookModel');
    })
    it('should throw error if attribute is not defined', () => {
      const expectedError = () => model.get('noAttribute');
      expect(expectedError).toThrow();
    })

    it('should get an attribute default value', () => {
      const title = model.get('title');
      expect(title).toEqual('Southern Smothered');
    })

    it('should set an attribute', () => {
      model.set('title', 'Down South Cooking');
      const title = model.get('title');
      expect(title).toEqual('Down South Cooking')
    })

    it('should fill attributes', () => {
      const expectedAttributes = {
        title: 'Good Cookin',
        summary: 'A collection of good recipes'
      }
      model.fill(expectedAttributes)
      const attributes = model.getAttributes();
      expect(attributes).toMatchObject(expectedAttributes);
    })

  })
})