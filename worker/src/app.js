import { AccessFDB } from './workerToFDBConnection.js';

// Hardcoded DB URL
const url = 'mongodb://34.68.250.182:80';

const accessFDB = new AccessFDB(url);

accessFDB.insertFile(1, 'JamesTest', 'Hello', 'CXCXCX', 'BINARY', 5).then(
  function(resp) {
    console.log(resp);
  },
  function(err) {
    console.log(err);
    throw err;
  },
);

console.log('Print');
