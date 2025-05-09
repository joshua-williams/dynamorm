import {DynamormException} from '../src/exceptions';
import {TestTable, db, client} from './fixtures/test-table';

jest.useFakeTimers()

describe('Create / Delete Table', () => {

  describe('Dynamorm container instance', () => {
    it('should create tables from container', async () => {
      await expect(db.createTables).rejects.not.toThrow(DynamormException);
    })

    it('should delete tables from container', async () => {
      await expect(db.deleteTables).rejects.not.toThrow(DynamormException);
    })
  })

  describe('Table instance', () => {
    let table;

    beforeEach(() => {
      table = new TestTable(client);
    })

    it('should create database table', async () => {
      const createTable = async () => {
        setTimeout(async () => await table.create(), 200)
      }
      expect(createTable).not.toThrow();
    })

    it('should create database table if not exists', async () => {
      const createTable = async () => {
        setTimeout(async () => await table.create('IF_NOT_EXISTS'), 200)
      }
      expect(createTable).not.toThrow(DynamormException);
    })

    it('should delete table', async () => {
      const deleteTable = async () => {
        setTimeout(async () => await table.delete(), 200)
      }
      expect(deleteTable).not.toThrow(DynamormException);
    })
  })
})
