// eslint-disable-next-line no-undef
const SERVER_PORT = process.env.PORT || 3000;
const path = require('path');
const express = require('express');
const webpack = require('webpack');
const QRCode = require('qrcode');
const bodyParser = require('body-parser')
const filter = require('leo-profanity');
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 10 });

const config = require('../webpack.config.dev');
const { mongoConnect, getDb } = require('../util/database');

const app = express();
const server = require('http').createServer(app);
const compiler = webpack(config);

const io = require('socket.io')(server);
const rooms = io.of('/').adapter.rooms;

const dispatchEvent = (message, client) => {
    const data = JSON.parse(message);
    const gameRoom = 'game_' + data.clientUuid;
    const room = rooms.get(gameRoom);
    let isClientInRoom = false;
    
    if (room && room.size < 2) {
        client.join(gameRoom);
        client.clientRoomid = gameRoom;
    }

    isClientInRoom = room && room.has(client.id);

    if (room && room.size <= 2 && isClientInRoom) {
        client.to(gameRoom).emit('message', JSON.stringify(data));
        client.emit('message', JSON.stringify(data));
    } else {
        data.error = true;
        data.errorMsg = 'This session started, please scan the new code.';

        client.emit('message', JSON.stringify(data));
    }
}

io.on('connection', client => {
    const gameId = uid();
    const gameRoom = 'game_' + gameId;

    client.join(gameRoom);
    client.roomId = gameRoom;

    client.emit('message', JSON.stringify({
        event: 'uuid',
        uuid: gameId
    }));

    client.on('request', data => { 
        dispatchEvent(data, client);
    });
    client.on('disconnect', () => {
        const clientRoomid = client.clientRoomid;

        client.to(clientRoomid).emit('message', JSON.stringify({
            event: 'session-over'
        }));

        io.socketsLeave(clientRoomid);
        io.socketsLeave(client.roomId);

    });
});

app.use(require('webpack-dev-middleware')(compiler, {
    //noInfo: true,
    publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res) {
    // eslint-disable-next-line no-undef
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/game', function(req, res) {
    // eslint-disable-next-line no-undef
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/public/remote-controls', function(req, res) {
    // eslint-disable-next-line no-undef
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/scores', function(req, res) {
    const db = getDb()

    if (db) {
        db.collection('scores').find().sort({value: -1}).toArray().then(scores => {
            res.json({
                scores: scores.slice(0, 10)
            });
        })
    }
});

app.post('/public/qrcode', function(req, res) {
    const data = req.body;
    const qrCodeUrl = req.protocol + '://' + req.get('host') + '/public/remote-controls?uuid=' + data.uuid;

    QRCode.toDataURL(qrCodeUrl, {color: {dark: '#ffffff', light: '#0000'}}, function (err, url) {
        res.json({
            qrCodeUrl: url
        });
    });

});

app.post('/public/save-score', function(req, res) {
    const db = getDb()
    const data = req.body;
    let success = false;
    let clearedName;
    let isValid = false;

    if (data.name && data.score) {
        clearedName = filter.clean(data.name);
        isValid = clearedName.length <= 4 && clearedName.length >= 1 && /^[a-zA-Z0-9]*$/.test(clearedName);

        if (isValid && db) {
            db.collection('scores').insertOne({
                name: data.name,
                value: data.score
            }).then(() => {
                success = true;
            }).catch(err => {
                console.error(err);
            }).then(() => {
                res.json({
                    success: success,
                    isValid: isValid
                });
            });
        } else {
            res.json({
                success: success,
                isValid: isValid
            });
        }
    } else {
        res.json({
            success: success,
            isValid: isValid
        });
    }
});

server.listen(SERVER_PORT, function(err) {
    if (err) {
        console.log(err);

        return;
    }

    mongoConnect();
    console.log('Listening at http://localhost:3000');
});