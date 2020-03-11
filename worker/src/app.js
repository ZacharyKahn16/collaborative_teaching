import { AccessFDB } from './workerToFDBConnection.js';
import http from 'http';
import io from 'socket.io';
import { LOGGER } from './Logger';
import { v4 } from 'uuid';

const httpServer = http.createServer();
const socketServer = io(httpServer);

// List of all FDBs in system
let fdbList = [];

// Client events
const CONNECTION_EVENT = 'connection';
const RETRIEVE_FILE = 'Retrieve File';
const INSERT_FILE = 'Insert File';
const UPDATE_FILE = 'Update File';
const DELETE_FILE = 'Delete File';

// Master events
const DATABASE_LIST = 'database-instances';

socketServer.on(CONNECTION_EVENT, function(socket) {
  // TODO: Retrieve list of files from Firebase
  // socket.on(RETRIEVE_FILE, function(req) {
  //   const docId = req.docId;
  //
  //   accessFDB.retrieveFile(docId).then(
  //     function(resp) {
  //       socket.emit('Server Response', {
  //         // TODO: Add a client request ID
  //         message: resp,
  //       });
  //     },
  //     function(err) {
  //       socket.emit('Server Response', {
  //         // TODO: Add a client request ID
  //         message: `Error retrieving file ${err}`,
  //       });
  //       throw err;
  //     },
  //   );
  // });

  socket.on(INSERT_FILE, function(req) {
    const docId = v4();
    const fileName = req.fileName;
    const fileContents = req.fileContents;
    const fileHash = req.fileHash;
    const fileType = req.fileType;
    const timeStamp = Date.now();

    // Pick two random FDBs to store this file
    for (let i = 0; i < 2; i++) {
      if (fdbList.length > 2) {
        const randomIndex = Math.floor(Math.random() * fdbList.length);
        fdbList[randomIndex]
          .insertFile(docId, fileName, fileContents, fileHash, fileType, timeStamp)
          .then(
            function(resp) {
              socket.emit('Server Response', {
                // TODO: Add a client request ID
                message: resp,
              });
            },
            function(err) {
              socket.emit('Server Response', {
                // TODO: Add a client request ID
                message: `Error inserting file ${err}`,
              });
              throw err;
            },
          );
      } else {
        socket.emit('Server Response', {
          // TODO: Add a request ID
          message: 'Not enough active FDBs',
        });
      }
    }
  });

  // TODO: Retrieve list of files from Firebase
  // socket.on(UPDATE_FILE, function(req) {
  //   const docId = req.docId;
  //   const fileName = req.fileName;
  //   const fileContents = req.fileContents;
  //   const fileHash = req.fileHash;
  //   const fileType = req.fileType;
  //   const timeStamp = Date.now();
  //
  //   accessFDB.updateFile(docId, fileName, fileContents, fileHash, fileType, timeStamp).then(
  //     function(resp) {
  //       socket.emit('Server Response', {
  //         // TODO: Add a request ID
  //         message: resp,
  //       });
  //     },
  //     function(err) {
  //       socket.emit('Server Response', {
  //         // TODO: Add a request ID
  //         message: `Error updating file ${err}`,
  //       });
  //       throw err;
  //     },
  //   );
  // });

  // TODO: Retrieve list of files from Firebase
  // socket.on(DELETE_FILE, function(req) {
  //   const docId = req.docId;
  //
  //   accessFDB.deleteFile(docId).then(
  //     function(resp) {
  //       socket.emit('Server Response', {
  //         // TODO: Add a client request ID
  //         message: resp,
  //       });
  //     },
  //     function(err) {
  //       socket.emit('Server Response', {
  //         // TODO: Add a client request ID
  //         message: `Error deleting file ${err}`,
  //       });
  //       throw err;
  //     },
  //   );
  // });

  // Master Handlers
  socket.on(DATABASE_LIST, function(req) {
    fdbList = []; // Reset fdbList
    for (let i = 0; i < req.length; i++) {
      const ipAddress = `mongodb://${req[i]['publicIp']}:80`;
      const fdbInstance = new AccessFDB(ipAddress);
      fdbList.push(fdbInstance);
    }
  });
});

const PORT = process.env.PORT || 4001;
httpServer.listen(PORT, () => {
  LOGGER.debug(`Server started at http://localhost:${PORT}`);
});
