/**
 * Classes for retrieving, inserting, updating, and deleting files on a FDB node.
 **/

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
// TODO(zacharykahn): Add code to get appropriate url of worker to connect to.
// This will involve query Metadata Cloud Database, figuring out which
// worker has the file of interest, and choosing one of them.

/**
 * Database collection structure for worker nodes.
 *
 * Defines the structure for inserting, updating, and retrieving docuements from
 * the Mongodb database at each worker.
 **/
class FileDatabase {
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
   * @return {Object} Structure of document.
   **/
  insertDocumentStructure(docId, fileName, fileContents, fileHash, fileType, ts) {
    return {
      docId: docId,
      fileName: fileName,
      fileContents: fileContents,
      fileHash: fileHash,
      fileType: fileType,
      fileCreationTime: ts,
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
        fileCreationTime: ts,
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
class AccessFDB {
  /**
   * @class
   * @param {String} url url that FDB is listening on.
   **/
  constructor(url) {
    this.url = url;
    // Name of FDB database.
    this.dbName = 'FDB';
    // Name of collection that stores files.
    this.fileCollectionName = 'fileInformation';
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
          console.log('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.find(query).toArray();
        },
        function(err) {
          console.log('ERROR RETRIEVING DATA FROM DB');
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        console.log('ERROR: Something went wrong with retrieval.');
        console.log(err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }

  /**
   * Insert new file.
   *
   * @param {Integer}  docId ID of document.
   * @param {String} fileName name of file.
   * @param {Binary} fileContents TODO (zacharykahn): Do we want to store file in binary?
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
          console.log('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.insertOne(fDBInsertInfo);
        },
        function(err) {
          console.log('ERROR INSERTING INTO DB');
          throw err;
        },
      )
      .then(function(resp) {
        return resp;
      })
      .catch(function(err) {
        console.log('ERROR: Something went wrong with insertion.');
        console.log(err);
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
          console.log('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          const newUpdate = { $set: updateInfo };
          return collection.updateOne(query, newUpdate, { upsert: true });
        },
        function(err) {
          console.log('ERROR UPDATING DOCUMENT.');
          throw err;
        },
      )
      .then(function(resp) {
        return resp;
      })
      .catch(function(err) {
        console.log('ERROR: Something went wrong with update.');
        console.log(err);
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
          console.log('ERROR CONNECTING TO DB');
          throw err;
        },
      )
      .then(
        function(collection) {
          return collection.deleteOne(query);
        },
        function(err) {
          console.log('ERROR DELETING DATA FROM DB');
          throw err;
        },
      )
      .then(function(items) {
        return items;
      })
      .catch(function(err) {
        console.log('ERROR: Something went wrong with deletion.');
        console.log(err);
        throw err;
      })
      .finally(function() {
        _db.close();
      });
  }
}

// Export classes.
module.exports.FileDatabase;
module.exports.AccessFDB;

// Toy example.
// This would be called by a real worker.
const url = 'mongodb://localhost:27017/';
let master = new AccessFDB(url);

// // Retrieve a file.
// master.retrieveFile(123).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// Delete a file
// master.deleteFile(123).then(
//   function(items) {
//     console.info("The promise was fulfilled with items!", items);
//   },
//   function(err) {
//     console.error(
//       "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//       err,
//       err.stack
//     );
//   }
// );

// // Update a file.
// master
//   .updateFile(
//     123,
//     "ANOTHER GO ROUND2.txt",
//     "new text!!!",
//     "newHash",
//     "txt",
//     Date.now()
//   )
//   .then(
//     function(items) {
//       console.info("The promise was fulfilled with items!", items);
//     },
//     function(err) {
//       console.error(
//         "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//         err,
//         err.stack
//       );
//     }
//   );

// Insert file.
// docId, fileName, fileContents, fileHash, fileType, ts;
// master
//   .insertFile(
//     123,
//     "NEWFILESHOWMEHOW.txt",
//     "hello world",
//     "hash123",
//     "txt",
//     Date.now()
//   )
//   .then(
//     function(items) {
//       console.info("The promise was fulfilled with items!", items);
//     },
//     function(err) {
//       console.error(
//         "*******\nTHE PROMISE WAS REJECTED\n*******\n",
//         err,
//         err.stack
//       );
//     }
//   );
