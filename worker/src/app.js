let fdbConnection = require('./workerToFDBConnection.js');

// Hardcoded DB URL
const url = 'mongodb://35.239.68.217:80';

// let fileDatabase = fdbConnection.FileDatabase;
let accessFDB = fdbConnection; //.AccessFDB

console.log(new accessFDB(url));

const SOCKET_PORT = process.env.PORT || 4001;
