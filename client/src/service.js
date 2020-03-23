import { v4 as uuidv4 } from "uuid";

const CONNECTION_EVENT = 'connection';
const RETRIEVE_FILE = 'Retrieve File';
const INSERT_FILE = 'Insert File';
const UPDATE_FILE = 'Update File';
const DELETE_FILE = 'Delete File';
const SERVER_RESP = 'Server Response';

const retrieveFile = (socket, fileName) => {
    socket.emit(RETRIEVE_FILE, {
        fileName: fileName
    });
}

//write new file
const writeNewFile = (socket, file) => {
    // Send worker a request to write a file into the FDB
    socket.emit(INSERT_FILE, {
      docId: uuidv4(),
      requestId: uuidv4(),
      fileName: file.name,
      fileContents: file.arrayBuffer(),
      fileHash: file.size,
      fileType: file.type
    });
}

const listen = (socket, cb) => {
    console.log("listening for worker response...");
    socket.on(SERVER_RESP, (resp) => {
        cb(resp);
    });
}

export { writeNewFile, retrieveFile, listen };