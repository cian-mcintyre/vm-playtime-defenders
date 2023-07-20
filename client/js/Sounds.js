import { onControlInput, sendData } from './services';

// Must be mapped with action key
// ex.: action 'start' -> sound src 'startSound'
const soundSrc = {
    startSound: require('../../static/default/sounds/start.mp3'),
    bulletsSound: require('../../static/default/sounds/shoot.mp3'),
    explosionSound: require('../../static/default/sounds/explosion.mp3'),
    engineSound: require('../../static/default/sounds/engine.mp3'),
    gameOverSound: require('../../static/default/sounds/game-over.mp3'),
    shipExplosionSound: require('../../static/default/sounds/ship-explosion.mp3'),
    backgroundSound: require('../../static/default/sounds/background.mp3'),
    //this fix sounds problem on iOS (https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari)
    iOSHackSound: require('../../static/default/sounds/iOSHackSound.mp3')
}

const bulletsCount = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const isPublic = window.location.pathname === '/';

let uuid;
let clientUuid;

function sendSoundEvent(action) {
    sendData({
        event: 'sound',
        soundName: this.name,
        soundAction: action,
        config: {
            volume: this.volume,
        },
        clientUuid: clientUuid,
        uuid: uuid
    });
}

class AsteroidsAudio extends Audio { 
    constructor(sound, name) {
        super(sound);

        this.src = sound;
        this.name = name;
    }

    instantPlay() {
        if (!isPublic) {
            this.pause();
            this.currentTime = 0.0;
            this.play();
        } else {
            sendSoundEvent.call(this, 'instantPlay');
        }
    }

    reset() {
        if (!isPublic) {
            this.pause();
            this.currentTime = 0.0;
            this.volume = 1;
        } else {
            sendSoundEvent.call(this, 'reset');
        }
    }

    play() {
        if (this.paused) {
            if (!isPublic) {
                super.play();
            } else {
                sendSoundEvent.call(this, 'play');
            }
        }
    }

    pause() {
        if (!this.paused) {
            if (!isPublic) {
                super.pause();
            } else {
                sendSoundEvent.call(this, 'pause');
            }
        }
    }

    setVolume(value) {
        if (value) {
            this.volume = value;
        }

        if (isPublic) {
            sendSoundEvent.call(this, 'setVolume');
        }
    }

}

function getBulletsSounds() {
    return bulletsCount.map(() => {
        return new AsteroidsAudio(soundSrc.bulletsSound, 'bullets');
    })
}

class BulletsAudio { 
    constructor() {
        this.bullets = getBulletsSounds();
        this.name = 'bullets';
        this.volume = 1;
    }

    instantPlay() {
        if (!isPublic) {
            this.play();
        } else {
            sendSoundEvent.call(this, 'instantPlay');
        }
    }

    play() {
        if (!isPublic) {
            const buletAudio = this.bullets.find(bullet => bullet.ended || bullet.paused);

            if (buletAudio) {
                buletAudio.play();
            }
        } else {
            sendSoundEvent.call(this, 'play');
        }
    }
}

const sounds = {
    start: new AsteroidsAudio(soundSrc.startSound, 'start'),
    bullets: new BulletsAudio(),
    explosion: new AsteroidsAudio(soundSrc.explosionSound, 'explosion'),
    engine: new AsteroidsAudio(soundSrc.engineSound, 'engine'),
    gameOver: new AsteroidsAudio(soundSrc.gameOverSound, 'gameOver'),
    shipExplosion: new AsteroidsAudio(soundSrc.shipExplosionSound, 'shipExplosion'),
    background: new AsteroidsAudio(soundSrc.backgroundSound, 'background'),
    iOSHack: new AsteroidsAudio(soundSrc.iOSHackSound, 'iOSHackSound'),
    initIOS: function () {
        // eslint-disable-next-line no-undef
        return Promise.all(Object.keys(this).map(key => {
            // eslint-disable-next-line no-undef
            return new Promise(resolve => {
                if (this[key].play && this[key].pause && this[key].src && key !== 'iOSHack') {
                    this[key].src = soundSrc.iOSHackSound;
                    this[key].play();

                    this[key].onended = () => {
                        this[key].src = soundSrc[key + 'Sound'];
    
                        // eslint-disable-next-line no-undef
                        resolve();
                    };
                } else {
                    resolve();
                }
            });
        }));
    }
};

onControlInput(data => {
    if (data.event === 'sound' && !isPublic) {
        sounds[data.soundName].volume = data.config.volume;
        sounds[data.soundName][data.soundAction]();
    } else if (data.uuid && data.clientUuid && data.event === 'startGame') {
        uuid = data.uuid;
        clientUuid = data.clientUuid
    }
});

export default sounds;