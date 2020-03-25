import { v4 as uuidv4 } from "uuid";

const CONNECTION_EVENT = 'connection';
const RETRIEVE_FILE = 'Retrieve File';
const INSERT_FILE = 'Insert File';
const UPDATE_FILE = 'Update File';
const DELETE_FILE = 'Delete File';
const SERVER_RESP = 'Server Response';
const GET_FILES = 'Get All Files';

const retrieveFile = (socket, docId, requestId) => {
    socket.emit(RETRIEVE_FILE, {
        // fileName: fileName
        docId: docId,
        requestId: requestId
    });
};

const getAllFiles = (socket, ownerId, requestId) => {
    socket.emit(GET_FILES, {
        ownerId: ownerId,
        requestId: uuidv4(),
    });
};

//write new file
const writeNewFile = async (socket, file, ownerId) => {
    // Send worker a request to write a file into the FDB
    console.log("sending on:");
    const textContents = await file.text();

    socket.emit(INSERT_FILE, {
        ownerId: ownerId,
        requestId: uuidv4(),
        fileName: file.name,
        fileContents: textContents,
        fileHash: file.size,
        fileType: file.type
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
const updateFile = async(socket, file) => {
    // const textContents = await file.text();

    // socket.emit(UPDATE_FILE, {
    //     docId: file.id,
    //     fileName: file.name,
    //     fileContents: textContents,
    //     fileType: file.type,
    //     requestId: uuidv4(),
    //     fileHash: file.size
    // });
};

const listen = (socket, cb) => {
    console.log("listening for worker response...");
    socket.on(SERVER_RESP, (resp) => {
        cb(resp);
    });
};

export { writeNewFile, retrieveFile, listen, updateFile, getAllFiles};
