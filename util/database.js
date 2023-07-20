const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = () => {
    MongoClient.connect(
        // eslint-disable-next-line no-undef
        process.env.DB_URL || 'mongodb+srv://asteroids:4Cisr5RjKPglPs1b@asteroids.banzpnx.mongodb.net/asteroids?retryWrites=true&w=majority'
    )
        .then(client => {
            console.log('DB Connected');
            _db = client.db();
        })
        .catch(err => {
            console.log(err);
            setTimeout(() => {
                console.log('Try to connect the database');
                mongoConnect();
            }, 60000);
        });
}

const getDb = () => {
    if (_db) {
        return _db;
    }

    console.error('Not database found!');
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;