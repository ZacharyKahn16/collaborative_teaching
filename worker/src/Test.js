const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://34.69.6.225:80';

MongoClient.connect(url, function(err, client) {
  if (err) throw err;
  const db = client.db('random');

  const collection = db.collection('hey');

  // Insert some documents
  collection.insertMany([{ Fuck: 'MONGO' }], function(err_next, result) {
    if (err_next) throw err;
    console.log('Inserted 3 documents into the collection');
  });
});
