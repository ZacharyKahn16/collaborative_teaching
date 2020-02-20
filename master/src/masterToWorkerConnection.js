/**
 * Classes for retrieving, inserting, and updating files on a worker node.
 **/

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
// TODO(zacharykahn): Add code to get appropriate url of worker to connect to.
// This will involve query Master Cloud Database, figuring out which
// worker has the file of interest, and choosing one of them.

/**
 * Database collection structure for worker nodes.
 *
 * Defines the structure for inserting, updating, and retrieving docuements from
 * the Mongodb database at each worker.
 **/
class CollabTeachingWorkerDb {
  /**
   * Document structure for insertion.
   *
   * @param {ObjectID}  docId _id of document.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents TODO (zacharykahn): Do we want to store file in binary?
   * @param {Integer} ts Timestamp.
   *
   * @return {Object} Structure of document.
   **/
  insertDocumentStructure(docId, fileName, fileContents, ts) {
    return {
      _id: docId,
      name: fileName,
      contents: fileContents,
      fileCreationTime: ts,
    };
  }

  /**
   * Document structure for insertion.
   *
   * @param {ObjectID}  docId _id of document.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents TODO (zacharykahn): Do we want to store file in binary?
   * @param {Integer} ts Timestamp.
   *
   * @return {Array} First element is for query, second is document updates.
   **/
  updateDocumentStructure(docId, fileName, fileContents, ts) {
    return [{ _id: docId }, { name: fileName, contents: fileContents, fileCreationTime: ts }];
  }

  /**
   * Document structure for insertion.
   *
   * @param {ObjectID}  docId _id of document.
   *
   * @return {Object} Query for document retrieval.
   **/
  retrieveDocumentStructure(docId) {
    return { _id: docId };
  }
}

/**
 * Access a worker to perform updates or queries.
 **/
class AccessWorker {
  /**
   * @class
   * @param {String} url url that worker is listening on.
   **/
  constructor(url) {
    this.url = url;
    // Name of worker database.
    this.dbName = 'workerDb';
    // Name of collection that stores files.
    this.fileCollectionName = 'fileInformation';
  }

  /**
   * Retrieve file with given document id.
   *
   * @param {ObjectID} docId _id of document.
   *
   * @return {Promise} Promise that returns documents on success, error otherwise.
   **/
  retrieveFile(docId) {
    // TODO (zacharykahn): Figure out how to ensure db is always closed.
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    // Generate query for retrieve documents.
    const query = new CollabTeachingWorkerDb().retrieveDocumentStructure(docId);
    return MongoClient.connect(this.url)
      .then(function(db) {
        const dbo = db.db(_dbName);
        const collection = dbo.collection(_fileCollectionName);
        return { items: collection.find(query).toArray(), dbInstance: db };
      })
      .then(function({ items, dbInstance }) {
        dbInstance.close();
        return items;
      })
      .catch(function(err) {
        console.log('Error when connecting to db.');
        console.log(err);
        throw err;
      });
  }

  /**
   * Insert new file.
   *
   * @param {String} fileName name of file.
   * @param {Binary} fileContents TODO (zacharykahn): Do we want to store file in binary?
   *
   * @return {Promise} Promise that returns if insertion was a success, error otherwise.
   **/
  insertFile(fileName, fileContents) {
    // TODO (zacharykahn): Figure out how to ensure db is always closed.
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    const docId = new ObjectID();
    const ts = Date.now();
    const workerDbInsertInfo = new CollabTeachingWorkerDb().insertDocumentStructure(
      docId,
      fileName,
      fileContents,
      ts,
    );

    return MongoClient.connect(this.url)
      .then(function(db) {
        const dbo = db.db(_dbName);
        const collection = dbo.collection(_fileCollectionName);

        return {
          resp: collection.insertOne(workerDbInsertInfo),
          dbInstance: db,
        };
      })
      .then(function({ resp, dbInstance }) {
        dbInstance.close();
        return resp;
      })
      .catch(function(err) {
        console.log('Error when connecting to db.');
        console.log(err);
        throw err;
      });
  }

  /**
   * Updates a file.
   *
   * @param {ObjectID} docId _id of document.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents TODO (zacharykahn): Do we want to store file in binary?
   *
   * @return {Promise} Promise that returns if insertion was a success, error otherwise.
   **/
  updateFile(docId, fileName, fileContents) {
    // TODO (zacharykahn): Figure out how to ensure db is always closed.
    const _dbName = this.dbName;
    const _fileCollectionName = this.fileCollectionName;
    const [query, updateInfo] = new CollabTeachingWorkerDb().updateDocumentStructure(
      docId,
      fileName,
      fileContents,
      Date.now(),
    );

    return MongoClient.connect(this.url)
      .then(function(db) {
        const dbo = db.db(_dbName);
        const collection = dbo.collection(_fileCollectionName);
        const newUpdate = { $set: updateInfo };
        return {
          resp: collection.update(query, newUpdate, { upsert: true }),
          dbInstance: db,
        };
      })
      .then(function({ resp, dbInstance }) {
        dbInstance.close();
        return resp;
      })
      .catch(function(err) {
        console.log('Error when connecting to db.');
        console.log(err);
        throw err;
      });
  }
}

// Export classes.
module.exports.CollabTeachingWorkerDb;
module.exports.AccessWorker;

// Toy example.
// This would be called by a real master.
const url = 'mongodb://localhost:27017/';
let master = new AccessWorker(url);

// Retrieve a file.
master.retrieveFile(ObjectID('5e4e1730b0b6d0e86ee2c225')).then(
  function(items) {
    console.info('The promise was fulfilled with items!', items);
  },
  function(err) {
    console.error('*******\nTHE PROMISE WAS REJECTED\n*******\n', err, err.stack);
  },
);

// Update a file.
master
  .updateFile(ObjectID('5e4e1730b0b6d0e86ee2c225'), 'someothernewfile.txt', 'blah blah jfakls;fas')
  .then(
    function(items) {
      console.info('The promise was fulfilled with items!', items);
    },
    function(err) {
      console.error('*******\nTHE PROMISE WAS REJECTED\n*******\n', err, err.stack);
    },
  );

// Insert file.
master.insertFile('someothernewfile.txt', 'blah blah jfakls;fas').then(
  function(items) {
    console.info('The promise was fulfilled with items!', items);
  },
  function(err) {
    console.error('*******\nTHE PROMISE WAS REJECTED\n*******\n', err, err.stack);
  },
);
