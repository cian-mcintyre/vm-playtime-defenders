import { io } from 'socket.io-client';

const socket = io();

export function getQrCodeUrl(uuid) {
    return fetch('/public/qrcode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uuid: uuid
        })
    }).then(response => {
        return response.json();
    }).then(data => {
        return data.qrCodeUrl;
    });
}

export function saveResults(results) {
    return fetch('/public/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(results)
    }).then(response => {
        return response.json();
    }).then(data => {
        return data;
    });
}

export function getScores() {
    return fetch('/scores').then(response => {
        return response.json();
    }).then(data => {
        return data.scores;
    });
}

export function onControlInput(setStateDataFn) {
    socket.on('message', incomingMessage => {
        let data = null;

        try {
            data = JSON.parse(incomingMessage);
        } catch (error) {
            data = null;
        }
    
        setStateDataFn(data);
    });
}

export function sendData(data) {
    const dataJson = JSON.stringify({
        event: 'gameControls',
        ...data
    });

    socket.emit('request', dataJson);
}

export function reconnect() {
    socket.disconnect();
    socket.connect();
}