const { MongoClient } = require('mongodb');
const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    const database = client.db('amoha');
    const notifications = database.collection('notifications');
    const docs = await notifications.find().limit(5).toArray();
    console.log(JSON.stringify(docs, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
