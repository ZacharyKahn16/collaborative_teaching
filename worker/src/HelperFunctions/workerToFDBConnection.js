/**
 * Classes for retrieving, inserting, updating, and deleting files on a FDB node.
 **/

const MongoClient = require('mongodb').MongoClient;
import { LOGGER } from '../Logger';
// TODO(zacharykahn): Add code to get appropriate url of worker to connect to.
// This will involve query Metadata Cloud Database, figuring out which
// worker has the file of interest, and choosing one of them.

/**
 * Database collection structure for worker nodes.
 *
 * Defines the structure for inserting, updating, and retrieving documents from
 * the Mongodb database at each worker.
 **/
export class FileDatabase {
  /**
   * Document structure for insertion.
   *
   * @param {Integer}  docId ID of document.
   * @param {String} fileName name of file.
   * @param {String} fileContents TODO (zacharykahn): Do we want to store file in binary?
   * @param {String} fileHash Hash of the file.
   * @param {String} fileType Type of file.
   * @param {Integer} ts Timestamp.
   *
   * @return {Object} Structure of document.
   **/
  insertDocumentStructure(docId, fileName, fileContents, fileHash, fileType, ts) {
    return {
      docId: docId,
      fileName: fileName,
      fileContents: fileContents,
      fileHash: fileHash,
      fileType: fileType,
      lastUpdated: ts,
    };
  }

  /**
   * Document structure for insertion.
   *
   * @param {Integer}  docId ID of document.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents TODO (zacharykahn): Do we want to store file in binary?
   * @param {String} fileHash Hash of the file.
   * @param {String} fileType Type of file.
   * @param {Integer} ts Timestamp.
   *
   * @return {Array} First element is for query, second is document updates.
   **/
  updateDocumentStructure(docId, fileName, fileContents, fileHash, fileType, ts) {
    return [
      { docId: docId },
      {
        fileName: fileName,
        fileContents: fileContents,
        fileHash: fileHash,
        fileType: fileType,
        lastUpdated: ts,
      },
    ];
  }

  /**
   * Document structure for insertion.
   *
   * @param {Integer}  docId ID of document.
   *
   * @return {Object} Query for document retrieval.
   **/
  retrieveDocumentStructure(docId) {
    return { docId: docId };
  }
}

/**
 * Access a worker to perform updates or queries.
 **/
export class AccessFDB {
  /**
   * @class
   * @param {String} ip ip the FDB is listening on.
   **/
  constructor(ip) {
    this.ip = ip;
    this.url = `mongodb://${ip}:80`;
    // Name of FDB database.
    this.dbName = 'FDB';
    // Name of collection that stores files.
    this.fileCollectionName = 'fileInformation';
  }

  /**
   * Retrieve the url this instance is connected to.
   *
   * @return {String} URL of this instance
   **/
  getUrl() {
    return this.url;
  }

  /**
   * Retrieve the ip address this instance is connected to
   *
   * @return {String} IP of this instance
   **/
  getIp() {
    return this.ip;
  }

  /**
   * Retrieve file with given document id.
   *
   * @param {Integer} docId ID of document.
   *
   * @return {Promise} Promise that returns documents on success, error otherwise.
   **/
  retrieveFile(docId) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    // Generate query for retrieve documents.
    const query = new FileDatabase().retrieveDocumentStructure(docId);
    let _db;
    return MongoClient.connect(this.url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.error('ERROR CONNECTING TO DB', err);
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.find(query).toArray();
        },
        function(err) {
          LOGGER.error('ERROR RETRIEVING DATA FROM DB', err);
          throw err;
        },
      )
      .then(function(items) {
        return items.length > 0 ? items[0] : items;
      })
      .catch(function(err) {
        LOGGER.error('ERROR: Something went wrong with retrieval.', err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Insert new file.
   *
   * @param {String}  docId ID of document.
   * @param {String} fileName name of file.
   * @param {String} fileContents TODO (zacharykahn): Do we want to store file in binary?
   * @param {String} fileHash Hash of the file.
   * @param {String} fileType Type of file.
   * @param {Integer} ts Timestamp.
   *
   * @return {Promise} Promise that returns if insertion was a success, error otherwise.
   **/
  insertFile(docId, fileName, fileContents, fileHash, fileType, ts) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    const fDBInsertInfo = new FileDatabase().insertDocumentStructure(
      docId,
      fileName,
      fileContents,
      fileHash,
      fileType,
      ts,
    );

    let _db;
    return MongoClient.connect(this.url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.error('ERROR CONNECTING TO DB', err);
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.insertOne(fDBInsertInfo);
        },
        function(err) {
          LOGGER.error('ERROR INSERTING INTO DB', err);
          throw err;
        },
      )
      .then(function(resp) {
        return resp;
      })
      .catch(function(err) {
        LOGGER.error('ERROR: Something went wrong with insertion.', err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Updates a file.
   *
   * @param {Integer}  docId _id of document.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents TODO (zacharykahn): Do we want to store file in binary?
   * @param {String} fileHash Hash of the file.
   * @param {String} fileType Type of file.
   * @param {Integer} ts Timestamp.
   *
   * @return {Promise} Promise that returns if insertion was a success, error otherwise.
   **/
  updateFile(docId, fileName, fileContents, fileHash, fileType, ts) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    const [query, updateInfo] = new FileDatabase().updateDocumentStructure(
      docId,
      fileName,
      fileContents,
      fileHash,
      fileType,
      ts,
    );

    let _db;
    return MongoClient.connect(this.url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.error('ERROR CONNECTING TO DB', err);
          throw err;
        },
      )
      .then(
        function(collection) {
          const newUpdate = { $set: updateInfo };
          return collection.updateOne(query, newUpdate, { upsert: true });
        },
        function(err) {
          LOGGER.error('ERROR UPDATING DOCUMENT.', err);
          throw err;
        },
      )
      .then(function(resp) {
        return resp;
      })
      .catch(function(err) {
        LOGGER.error('ERROR: Something went wrong with update.', err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Delete file with given document id.
   *
   * @param {Integer} docId ID of document.
   *
   * @return {Promise} Promise that returns documents on success, error otherwise.
   **/
  deleteFile(docId) {
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    // Generate query for delete documents (same as retrieve).
    const query = new FileDatabase().retrieveDocumentStructure(docId);
    let _db;
    return MongoClient.connect(this.url)
      .then(
        function(db) {
          _db = db;
          const dbo = db.db(_dbName);
          return dbo.collection(_fileCollectionName);
        },
        function(err) {
          LOGGER.error('ERROR CONNECTING TO DB', err);
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.deleteOne(query);
        },
        function(err) {
          LOGGER.error('ERROR DELETING DATA FROM DB', err);
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        LOGGER.error('ERROR: Something went wrong with deletion.', err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }
}
