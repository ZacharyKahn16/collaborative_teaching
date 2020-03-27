import { v4 as uuidv4 } from "uuid";
import sha256 from "crypto-js/sha256";

const CONNECTION_EVENT = "connection";
const RETRIEVE_FILE = "Retrieve File";
const INSERT_FILE = "Insert File";
const UPDATE_FILE = "Update File";
const DELETE_FILE = "Delete File";
const SERVER_RESP = "Server Response";
const GET_FILES = "Get All Files";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(file);
  });
}

const retrieveFile = (socket, docId, requestId) => {
  socket.emit(RETRIEVE_FILE, {
    // fileName: fileName
    docId: docId,
    requestId: requestId,
  });
};

//write new file
const writeNewFile = (socket, file, ownerId) => {
  // Send worker a request to write a file into the FDB
  readFileAsDataUrl(file)
    .then((dataUrl) => {
      const hash = sha256(dataUrl).toString();
      console.log("sending file with hash: ", hash);

      socket.emit(INSERT_FILE, {
        ownerId: ownerId,
        requestId: uuidv4(),
        fileName: file.name,
        fileContents: dataUrl,
        fileHash: hash,
        fileType: file.type,
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

// delete a file
const deleteFile = async (socket) => {
  // console.log("deleting file")
  // socket.emit(DELETE_FILE, {
  //     docId:
  // });
};

//update a file
const updateFile = async (socket, file, docId) => {
  const textContents = await file.text();
  socket.emit(UPDATE_FILE, {
    docId: docId,
    fileName: file.name,
    fileContents: textContents,
    fileType: file.type,
    requestId: uuidv4(),
    fileHash: file.size,
  });
};

const listen = (socket, cb) => {
  console.log("listening for worker response...");
  socket.on(SERVER_RESP, (resp) => {
    cb(resp);
  });
};

const retrieveAllFiles = (socket, cb) => {
  console.log("Waiting for all files");
  socket.on("All Files", (resp) => {
    cb(resp);
  });
};

export { writeNewFile, retrieveFile, listen, updateFile, retrieveAllFiles };
