/* eslint-disable react/no-string-refs */
import React, { Component } from 'react';
import Ship from './Ship';
import Alien from './Alien';
import Ufo from './Ufo';
import InfinityBox from './InfinityBox';
import { randomNumBetweenExcluding, randomNumBetween } from './helpers';
import { getQrCodeUrl, saveResults, getScores, onControlInput, sendData, reconnect } from './services';
import sounds from './Sounds';
import throttle from 'lodash.throttle';
import ReactNipple from './ReactNipple';
import filter from 'leo-profanity';

const KEY = {
    LEFT:  37,
    RIGHT: 39,
    UP: 38,
    A: 65,
    D: 68,
    W: 87,
    SPACE: 32
};

function iOS() {
    return [
        'iPhone Simulator',
        'iPod Simulator',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
}

export class Reacteroids extends Component {
    throttledUpadate = throttle(this.update.bind(this), 30);

    constructor() {
        super();
        this.state = {
            screen: {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.devicePixelRatio || 1,
            },
            context: null,
            keys : {
                left  : 0,
                right : 0,
                up    : 0,
                down  : 0,
                space : 0,
            },
            asteroidCount: 5,
            currentScore: 0,
            topScore: localStorage['topscore'] || 0,
            topScores: [],
            inGameStatus: 'prepare-game',
            publicQrCode: null,
            shipPosition: null,
            fireControl: null,
            isJoystickReady: false,
            isFireButtonReady: false,
            resultsSubmited: false,
            isRemoteControl: window.location.pathname === '/public/remote-controls',
            isPublic: window.location.pathname === '/',
            isGame: window.location.pathname === '/game',
            clientUuid: new URLSearchParams(window.location.search).get('uuid') || '',
            isFullScreen: false,
            isPseudoControlShown: true,
            uuid: '',
            restartTime: 30000,
            countdown: -1,
            isIOSPhone: iOS(),
            isIOSSoundsInited: false
        };
        this.ship = [];
        this.asteroids = [];
        this.ufo = [];
        this.infinityBox = [];
        this.bullets = [];
        this.particles = [];
        this.stars = [];
        this.qrCodeUrl = null;
        this.starsGenerated = false;
        this.alienParams = this.getAlienParams();
        this.ufoParams = this.getUfoParams();
        this.infinityBoxParams = this.getInfinityBoxParams();

        // Bind events handlers
        this.handleQrCodeUrlLoaded = this.handleQrCodeUrlLoaded.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    isSmallView() {
        return !window.matchMedia('screen and (min-width: 916px)').matches
    }

    getShipParams() {
        return {
            shipSize: this.isSmallView() ? 35 : 75,
            speed: this.isSmallView() ? 0.03 : 0.15,
            bulletSpeedCoeff: this.isSmallView() ? 0.2 : 0.5
        }
    }

    getAlienParams() {
        return {
            baseSize: this.isSmallView() ? 15 : 25,
            size: this.isSmallView() ? 15 : 25,
            speed: this.isSmallView() ? 0.8 : 1.5
        }
    }

    getUfoParams() {
        return {
            baseSize: this.isSmallView() ? 18 : 30,
            size: this.isSmallView() ? 18 : 30,
            speed: this.isSmallView() ? 1.5 : 3,
            generateUfo: this.generateUfo.bind(this)
        }
    }

    getInfinityBoxParams() {
        return {
            baseSize: this.isSmallView() ? 15 : 25,
            size: this.isSmallView() ? 15 : 25,
            speed: this.isSmallView() ? 1 : 2,
            generateInfinityBox: this.generateInfinityBox.bind(this),
            setRapidFire: this.setRapidFire.bind(this)
        }
    }

    openFullscreen() {
        const elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }

    handleResize(){
        this.starsGenerated = false;
        this.stars = [];

        this.setState({
            screen : {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.devicePixelRatio || 1,
            },
            isFullScreen:(window.fullScreen) ||
                    (document.fullscreenElement === document.documentElement) ||
                    (window.innerWidth == screen.width && window.innerHeight == screen.height)
        });
    }

    handleKeys(value, e){
        const keys = this.state.keys;

        if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) {keys.left  = value;}

        if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) {keys.right = value;}

        if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) {keys.up    = value;}

        if(e.keyCode === KEY.SPACE) {keys.space = value;}

        this.setState({
            keys : keys
        });
    }

    componentDidMount() {
        window.addEventListener('keyup',   this.handleKeys.bind(this, false));
        window.addEventListener('keydown', this.handleKeys.bind(this, true));
        window.addEventListener('resize',  this.handleResize.bind(this, false));

        this.initContext = this.refs.canvas.getContext('2d');

        this.initGame();
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.handleKeys);
        window.removeEventListener('keydown', this.handleKeys);
        window.removeEventListener('resize', this.handleResize);
    }

    initISOSounds() {
        if (!this.state.isIOSSoundsInited && this.state.isIOSPhone) {
            this.setState({
                isIOSSoundsInited: true
            });

            return sounds.initIOS();
        } else {
            // eslint-disable-next-line no-undef
            return Promise.resolve();
        }
    }

    initGame() {
        this.setState({ context: this.initContext });

        getScores().then(scores => {
            this.setState({ topScores: scores });
        });

        this.getScoresTimerId = setInterval((() => {
            getScores().then(scores => {
                this.setState({ topScores: scores });
            });
        }).bind(this), 30000);

        this.prepareGame();
    
        requestAnimationFrame(() => {this.update();});
    }

    restartGame() {
        reconnect();

        clearInterval(this.gameOverTimer);
        
        this.setState({
            inGameStatus: 'prepare-game',
            currentScore: 0,
            countdown: -1,
            asteroidCount: 5
        });

        this.alienParams = this.getAlienParams();
        this.ufoParams = this.getUfoParams();
        this.infinityBoxParams = this.getInfinityBoxParams();
    }

    handleQrCodeUrlLoaded(qrCodeUrl) {
        this.setState({ qrCodeUrl: qrCodeUrl });
    }

    update() {
        const context = this.state.context;

        context.save();
        context.scale(this.state.screen.ratio, this.state.screen.ratio);

        const width = this.state.screen.width;
        const height = this.state.screen.height;

        // Set grid properties
        const gridSize = 10; // Size of each grid cell
        const gridColor = context.createLinearGradient(0, 0, 0, height); // Color of the grid lines

        gridColor.addColorStop(0, 'rgba(154, 0, 55, 1)');
        gridColor.addColorStop(0.40, 'rgba(169, 2, 37, 1)');
        gridColor.addColorStop(0.70, 'rgba(176, 0, 2, 1)');
        gridColor.addColorStop(1, 'rgba(163, 3, 4, 1)');

        // Clear the canvas
        context.clearRect(0, 0, width, height);

        // Create gradient background
        const gradient = context.createLinearGradient(0, 0, 0, height);
        
        gradient.addColorStop(0, 'rgb(152, 12, 63)');
        gradient.addColorStop(0.40, 'rgb(150, 1, 47)');
        gradient.addColorStop(0.70, 'rgb(166, 1, 5)');
        gradient.addColorStop(1, 'rgb(155, 3, 2)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
    
        // Set the grid
        context.strokeStyle = gridColor;

        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        // Create radial darck glow
        const radialGradient = context.createRadialGradient(width/2, height/2, 0, width/2, height/2, height);

        radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
        radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        context.fillStyle = radialGradient;
        context.fillRect(0, 0, width, height);

        // }

        // Motion trail
        //context.fillStyle = grd;//'#8F031C';
        //context.globalAlpha = 0.4;
        //context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
        //context.globalAlpha = 1;

        if(!this.starsGenerated) {
            this.generateStars(context, width, height);
        }
    
        this.drawStars(context);

        // Next set of asteroids
        if(!this.asteroids.length && !this.state.isRemoteControl){
            const count = this.state.asteroidCount + 1;

            this.alienParams.speed += this.alienParams.speed * 0.1;
            this.ufoParams.speed += this.ufoParams.speed * 0.1;
            this.infinityBoxParams.speed += this.infinityBoxParams.speed * 0.1;

            this.setState({ asteroidCount: count });
            this.generateAsteroids(count);
        }

        // Check for colisions
        this.checkCollisionsWith(this.bullets, this.asteroids);
        this.checkCollisionsWith(this.ship, this.asteroids);
        this.checkCollisionsWith(this.bullets, this.ufo);
        this.checkCollisionsWith(this.ship, this.ufo);
        this.checkCollisionsWith(this.bullets, this.infinityBox);
        this.checkCollisionsWith(this.ship, this.infinityBox);

        // Remove or render
        this.updateObjects(this.particles, 'particles');
        this.updateObjects(this.asteroids, 'asteroids');
        this.updateObjects(this.bullets, 'bullets');
        this.updateObjects(this.ship, 'ship');
        this.updateObjects(this.ufo, 'ufo');
        this.updateObjects(this.infinityBox, 'infinityBox');

        context.restore();

        // Next frame
        if (this.state.isRemoteControl) {
            requestAnimationFrame(() => {this.throttledUpadate();});
        } else {
            requestAnimationFrame(() => {this.update();});
        }
    }

    // Generate a random color
    getRandomColor() {
        const colors = [
            'rgba(208, 208, 96, 0.5)',
            'rgba(223, 84, 226, 0.5)',
            'rgbs(234, 209, 230, 0.5)',
            'rgba(185, 97, 149, 0.5)',
            'rgba(220, 76, 218, 0.5)'];
        const randomIndex = Math.floor(Math.random() * colors.length);

        return colors[randomIndex];
    }

    // Generate a random color opacity
    getRandomOpacity(rgbaColor) {
        const newColor = rgbaColor.replace(/[^,]+(?=\))/, Math.random() * (1 - 0.5) + 0.5);

        return newColor;
    }

    // Generate a random color
    generateStars(context, width, height) {
        // Draw stars (random dots)
        const numStars = 175; // Number of stars
        const minSize = 3; // Minimum size of stars
        const maxSize = 5; // Maximum size of stars
        let star = {};

        for (let i = 0; i < numStars; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * (maxSize - minSize) + minSize;
            const color = this.getRandomColor();

            star = {
                x: x,
                y: y,
                size: size,
                color: color
            }
            this.createObject(star, 'stars');
        }

        this.starsGenerated = true;
    }

    drawStars(context){
        for (let i = 0; i < this['stars'].length; i++) {
            context.fillStyle = this.getRandomOpacity(this['stars'][i].color);
            context.fillRect(this['stars'][i].x, this['stars'][i].y, this['stars'][i].size, this['stars'][i].size);
        }
    }

    addScore(points){
        if(this.state.inGameStatus === 'game-in-progress'){
            this.setState({
                currentScore: this.state.currentScore + points,
            });
        }
    }

    prepareGame(){
        this.setState({
            inGameStatus: 'prepare-game',
            currentScore: 0,
        });

        // Make asteroids
        this.asteroids = [];
        this.generateAsteroids(this.state.asteroidCount + 1)
        this.generateUfo()
        this.generateInfinityBox()

        onControlInput((controlData) => {
            if (!controlData) {
                return;
            }

            if (controlData.event === 'uuid') {
                this.setState({ uuid: controlData.uuid})
            }
            
            if (controlData.event === 'startGame') {
                this.startGame();
            } else if (this.state.isRemoteControl) {
                if (controlData.event === 'game-over') {
                    this.remoteGameOver(controlData);
                }
            } else if (controlData.event === 'uuid') {
                getQrCodeUrl(controlData.uuid).then(qrCodeData => {
                    this.handleQrCodeUrlLoaded(qrCodeData);
                });
            } else if (controlData.event === 'session-over') {
                if (this.state.isRemoteControl) {
                    this.remoteGameOver(controlData);
                } else {
                    this.ship.forEach(ship => ship.destroy());
                    this.restartGame();
                }
            }
            else {
                this.setState(controlData);
            }
        });
    }

    startOnlineGame() {
        clearInterval(this.gameOverTimer);

        this.setState({
            countdown: -1
        });

        this.initISOSounds().then(() => {
            if (!this.state.isRemoteControl) {
                this.startGame();
            } else {
                this.sendControlData({ event: 'startGame' })
            }
        });
    }

    startGame(){
        clearInterval(this.gameOverTimer);

        if (this.refreshGameTimeOutID) {
            clearTimeout(this.refreshGameTimeOutID);
        }

        this.setState({
            inGameStatus: 'game-in-progress',
            currentScore: 0,
            resultsSubmited: false,
            shipPosition: null,
            fireControl: {
                fire: false 
            }
        });

        // Make ship
        const ship = new Ship({
            position: {
                x: this.state.screen.width/2,
                y: this.state.screen.height/2
            },
            create: this.createObject.bind(this),
            onDie: this.gameOver.bind(this),
            ...this.getShipParams()
        });

        this.createObject(ship, 'ship');

        if (!this.state.isPublic) {
            this.createControls();
        }

        this.ufo = [];
        this.infinityBox = [];
        this.asteroids = [];
        this.generateAsteroids(this.state.asteroidCount);
        this.generateUfo();
        this.generateInfinityBox();

        sounds.background.volume = 0.35;
        sounds.background.loop = true;
        sounds.background.play();
    }

    createControls() {
        this.createJoystick();
        this.createFireButton();

        this.setState({ controlsReady: true });
    }

    createJoystick() {
        const throttledSendControlData = throttle(this.sendControlData.bind(this), 30);

        this.controlsJoystick = new ReactNipple({
            options: {
                mode: this.state.isRemoteControl ? 'semi' : 'dynamic',
                position: { top: '75%', left: '25%' },
                size: 100,
                follow: true
            },
            className: 'joystick',
            onMove: (evt, data) => {
                if (!this.state.isRemoteControl) {
                    this.setState({ shipPosition: data });
                } else {
                    throttledSendControlData({
                        event: 'shipControls',
                        shipPosition: {
                            angle: data.angle,
                            force: data.force
                        }
                    })
                }

                if (this.state.isPseudoControlShown) {
                    this.setState({
                        isPseudoControlShown: false
                    });
                }
            },
            onEnd: () => {
                if (!this.state.isRemoteControl) {
                    this.setState({ shipPosition: {
                        force: 0
                    }});
                } else {
                    throttledSendControlData({
                        event: 'shipControls',
                        shipPosition: {
                            force: 0
                        }
                    });
                }
            }
        });

        this.joystickRender = this.controlsJoystick.render();
    }

    createFireButton() {
        this.controlsFireButton = new ReactNipple({
            options: {
                mode: this.state.isRemoteControl ? 'static' : 'dynamic',
                position: { top: '75%', left: '75%' },
                size: 100,
                lockX: true,
                lockY: true
            },
            className: 'fire-button',
            onStart: () => {
                if (!this.state.isRemoteControl) {
                    this.setState({ fireControl: {
                        fire: true 
                    }});
                } else {
                    this.sendControlData({
                        event: 'shipControls',
                        fireControl: {
                            fire: true 
                        }
                    });
                }

            },
            onEnd: () => {
                if (!this.state.isRemoteControl) {
                    this.setState({ fireControl: {
                        fire: false 
                    }});
                } else {
                    this.sendControlData({
                        event: 'shipControls',
                        fireControl: {
                            fire: false 
                        }
                    });
                }
            }
        });

        this.fireButtonRender = this.controlsFireButton.render();
    }

    setCountdown() {
        if (this.state.isRemoteControl || this.state.isPublic) {
            let distance = this.state.restartTime;

            this.setState({
                countdown: Math.floor((distance % (1000 * 60)) / 1000)
            })

            distance -= 1000;

            this.gameOverTimer = setInterval((() => {
                this.setState({
                    countdown: Math.floor((distance % (1000 * 60)) / 1000)
                })

                distance -= 1000;
            }), 1000);

            setTimeout(() => {
                if (distance <= 0) {
                    clearInterval(this.gameOverTimer);
    
                    this.setState({
                        countdown: -1
                    })
                }
            }, this.state.restartTime);
        }
    }

    gameOver(){
        sounds.background.reset()
        sounds.shipExplosion.play();
        sounds.shipExplosion.onended = () => sounds.gameOver.instantPlay();

        this.setState({
            inGameStatus: 'game-over',
        });

        // Replace top score
        if(this.state.currentScore > this.state.topScore){
            this.setState({
                topScore: this.state.currentScore,
            });
            localStorage['topscore'] = this.state.currentScore;
        }

        this.sendControlData({
            event: 'game-over',
            clientUuid: this.state.uuid,
            score: this.state.currentScore
        })

        if (this.state.isPublic) {
            this.refreshGameTimeOutID = setTimeout(this.restartGame.bind(this), this.state.restartTime);
        }

        this.setCountdown();
    }

    remoteGameOver(data) {
        sounds.background.reset()
        sounds.shipExplosion.play();
        sounds.shipExplosion.onended = () => sounds.gameOver.instantPlay();

        this.setCountdown();

        this.setState({
            inGameStatus: 'remote-game-over',
            currentScore: data.score
        });
    }

    generateAsteroids(howMany){
        for (let i = 0; i < howMany; i++) {
            const verticalEdge =  Math.random() < 0.5;
            const firstSide =  Math.random() < 0.5;
            const position = {
                x: verticalEdge ? randomNumBetweenExcluding(0, this.state.screen.width) : (firstSide ? 0 : this.state.screen.width),
                y: !verticalEdge ? randomNumBetweenExcluding(0, this.state.screen.height) : (firstSide ? 0 : this.state.screen.height)
            }

            const asteroid = new Alien({
                type: this.getRandomAlienType(),
                position: position,
                create: this.createObject.bind(this),
                addScore: this.addScore.bind(this),
                ...this.alienParams
            });

            this.createObject(asteroid, 'asteroids');
        }
    }

    generateUfo(){
        clearTimeout(this.generateUfoTimeOutId);

        this.generateUfoTimeOutId = setTimeout(() => {
            const verticalEdge =  Math.random() < 0.5;
            const firstSide =  Math.random() < 0.5;
            const position = {
                x: verticalEdge ? randomNumBetweenExcluding(0, this.state.screen.width) : (firstSide ? 0 : this.state.screen.width),
                y: !verticalEdge ? randomNumBetweenExcluding(0, this.state.screen.height) : (firstSide ? 0 : this.state.screen.height)
            }

            if (this.asteroids.length > 3) {    
                this.ufo = [];
    
                const ufo = new Ufo({
                    position: position,
                    create: this.createObject.bind(this),
                    addScore: this.addScore.bind(this),
                    ...this.ufoParams
                });
        
                this.createObject(ufo, 'ufo');
            } else {
                this.generateUfo();
            }
        }, randomNumBetween(10000, 15000));
    }

    generateInfinityBox(){
        clearTimeout(this.generateInfinityBoxTimeOutId);

        this.generateInfinityBoxTimeOutId = setTimeout(() => {
            const verticalEdge =  Math.random() < 0.5;
            const firstSide =  Math.random() < 0.5;
            const position = {
                x: verticalEdge ? randomNumBetweenExcluding(0, this.state.screen.width) : (firstSide ? 0 : this.state.screen.width),
                y: !verticalEdge ? randomNumBetweenExcluding(0, this.state.screen.height) : (firstSide ? 0 : this.state.screen.height)
            }

            if (this.asteroids.length > 3) {
                this.infinityBox = [];
    
                const infinityBox = new InfinityBox({
                    position: position,
                    create: this.createObject.bind(this),
                    addScore: this.addScore.bind(this),
                    ...this.infinityBoxParams
                });
        
                this.createObject(infinityBox, 'infinityBox');
            } else {
                this.generateInfinityBox();
            }
        }, randomNumBetween(10000, 15000));
    }

    setRapidFire() {
        this.ship.forEach(ship => {
            ship.isRapidFire = true;
        });

        setTimeout(() => {
            this.ship.forEach(ship => {
                ship.isRapidFire = false;
            });
        }, 8000);
    }

    createObject(item, group){
        if (!this.state.isRemoteControl) {
            this[group].push(item);
        }
    }

    updateObjects(items, group){
        let index = 0;

        for (const item of items) {
            if (item.delete) {
                this[group].splice(index, 1);
            }else{
                items[index].render(this.state);
            }

            index++;
        } 
    }

    checkCollisionsWith(items1, items2) {
        var a = items1.length - 1;
        var b;

        for(a; a > -1; --a){
            b = items2.length - 1;

            for(b; b > -1; --b){
                var item1 = items1[a];
                var item2 = items2[b];

                if(this.checkCollision(item1, item2)){
                    item1.destroy(this.state);
                    item2.destroy(this.state);

                    if (!(item1 instanceof Ship) && !(item2 instanceof Ship)) {
                        sounds.explosion.instantPlay();
                    }
                }
            }
        }
    }

    checkCollision(obj1, obj2){
        var vx = obj1.position.x - obj2.position.x;
        var vy = obj1.position.y - obj2.position.y;
        var length = Math.sqrt(vx * vx + vy * vy);

        if(length < obj1.radius + obj2.radius){
            return true;
        }

        return false;
    }

    destroyControls() {
        if (this.controlsJoystick && this.controlsJoystick.joystick) {
            this.controlsJoystick.joystick.destroy();
            this.controlsJoystick.joystick = undefined;
            this.joystickRender = null;

            this.setState({ shipPosition: {
                force: 0
            }});
        }

        if (this.controlsFireButton && this.controlsFireButton.joystick) {
            this.controlsFireButton.joystick.destroy();
            this.controlsFireButton.joystick = undefined;
            this.fireButtonRender = null;

            this.setState({ fireControl: {
                fire: false
            }});
        }
    }

    sendControlData(data) {
        sendData({
            clientUuid: this.state.clientUuid,
            uuid: this.state.uuid,
            ...data
        });
    }

    handleChange(event) {
        const value = event.target.value;
        const isValid = value.length <= 4 && value.length >= 1 && /^[a-zA-Z0-9]*$/.test(value);

        this.setState({
            value: filter.clean(value),
            isValid: isValid
        });
    }
    
    handleSubmit(event) {
        event.preventDefault();

        if (this.state.value && this.state.currentScore && this.state.isValid) {
            saveResults({
                name: this.state.value.toUpperCase(),
                score: this.state.currentScore
            }).then((result) => {
                if (result.isValid) {
                    getScores().then(scores => {
                        this.setState({
                            topScores: scores,
                            resultsSubmited: true
                        });
                    });
                }
            });
        }
    }

    getTopScoreElement() {
        let colorIndex = 0;
        let topScores = this.state.topScores;

        if (this.state.inGameStatus === 'game-in-progress') {
            topScores = topScores.slice(0, 3);
        }

        return topScores.map((score, index )=> {
            const colorsCount = ['first', 'second', 'third'];
            const scoreItemClass = 'score-board-item ' + colorsCount[colorIndex];

            colorIndex = colorIndex > 1 ? 0 : colorIndex + 1;

            return <li key={index} className={ scoreItemClass }>{score.name} {score.value}</li>
        })
    }

    render() {
        let endgame;
        let qrCode;
        let logo;
        let endGameAction;
        let endGameTryAgain;
        let fullScreenBtn;
        let startButtonClass;
        let pseudoControl;
        let info;
        let flipYourPhoneTooltip;
        let controlsToolTips;

        if (!this.state.isRemoteControl && !this.state.isGame) {
            startButtonClass = 'h-hidden';
        }

        if (this.state.isRemoteControl && this.state.isPseudoControlShown && this.state.inGameStatus === 'game-in-progress') {
            pseudoControl = (
                <div className='pseudo-controlls'></div>
            )
        }

        if(this.state.inGameStatus == 'prepare-game'){
            if (this.state.qrCodeUrl && !this.state.isRemoteControl && !this.state.isGame) {
                qrCode = (
                    <div className="qrCode-img-wrapper">
                        <img className="qrCode-img" src={ this.state.qrCodeUrl } onClick={ this.startOnlineGame.bind(this) }/>
                    </div>
                );
            }

            
            if (window.innerHeight > window.innerWidth) {
                flipYourPhoneTooltip = (<div className="orientation-tooltip">For best experience flip your phone</div>);
            }

            if (!this.state.isRemoteControl && !this.state.isGame) {
                info = ( <p className="logo-subtitle">Scan here to play</p> )
            }

            endgame = (
                <div className="logo prepare-game">
                    <div className="logo-img-wrapper">
                        <img className="logo-img" src={window.location.origin + '/static/img/logo.png'}/>
                    </div>
                    <p className="logo-title">PLAYTIME DEFENDERS</p>
                    { info }
                    <button
                        className={ 'button logo-button ' + startButtonClass }
                        onClick={ this.startOnlineGame.bind(this) }>
                        Press to Start
                    </button>
                    { qrCode }
                    { flipYourPhoneTooltip }
                </div>
            )

            if (!this.state.isFullScreen && !this.state.isIOSPhone) {
                fullScreenBtn = (
                    <button
                        className="button full-screen"
                        onClick={ this.openFullscreen.bind(this) }>
                        <i className="fa fa-expand"></i>
                        <span className="h-hidden">Full screen</span>
                    </button>
                )
            }
        } else {
            logo = (
                <div className="logo-img-wrapper-game">
                    <img className="logo-img-game" src={window.location.origin + '/static/img/logo.png'}/> 
                    <span className="logo-title-game">It&apos;s Playtime</span>
                </div>
            )
        }

        if (this.state.resultsSubmited) {
            endGameAction = (
                <div className="result-score-wrapper">
                    Your results are saved!
                </div>
            );
        } else if (this.state.currentScore && !this.state.isPublic) {
            endGameAction = (
                <form onSubmit={this.handleSubmit} className="score-form">
                    <div className="input-score-wrapper">
                        <label className="input-score-label h-margin-bottom" htmlFor="input-score" >Name:</label>
                        <input
                            className="input-score h-margin-bottom"
                            id="input-score"
                            type="text"
                            name="name"
                            value={this.state.value}
                            onChange={this.handleChange}
                            required
                            pattern="[a-zA-Z0-9]*"
                            minLength="1"
                            maxLength="4"
                        />
                        <button className="button" type="submit">Submit</button>
                    </div>
                </form>
            );
        }

        if (this.state.countdown >= 0 && (this.state.isRemoteControl || this.state.isPublic)) {
            info = ( <p className="endgame-timer-tooltip">End game after: { this.state.countdown }</p> )
        }

        if (!this.state.isPublic) {
            endGameTryAgain = (
                <button className="button"
                    onClick={ this.startOnlineGame.bind(this) }>
                    try again?
                </button>
            );
        }

        if(this.state.inGameStatus == 'game-over'){
            endgame = (
                <div className="logo game-over">
                    <p className="logo-title logo-title-game-over">Game over!</p>

                    { endGameAction }
                    { endGameTryAgain }
                    { info }
                    
                </div>
            );

            this.destroyControls();
        }
        
        if(this.state.inGameStatus == 'remote-game-over'){
            if (this.state.countdown < 0) {
                endGameTryAgain = null;
            }

            endgame = (
                <div className="logo game-over">
                    <p className="score-result">Your score: { this.state.currentScore }</p>
                    { endGameAction }
                    { info }
                    { endGameTryAgain }
                </div>
            );

            this.destroyControls();
        }

        if (this.state.inGameStatus == 'game-in-progress') {
            if (this.isSmallView() || this.state.isRemoteControl || this.state.isPublic) {
                controlsToolTips = (
                    <div className='tooltip'>
                        Use joystick on left to move. Use button on right to shoot.
                    </div>
                )
            } else if (this.state.isGame) {
                controlsToolTips = (
                    <div className='tooltip'>
                        [↑] or [W] - Accelerate, [←][→] or [A][D] - Turn, [Space] - Shoot
                    </div>
                )
            }
        }

        return (
            <div className="main-wrapper">
                <div className="score-board">
                    <div className="score-board-user">
                        <span className="score-board-current-score-title" >YOUR SCORE:</span>
                        <span className="score-board-current-score-result">{this.state.currentScore}</span>
                    </div>
                    <div className="score-board-leader">
                        <span className="score-board-title" >LEADERBOARD</span>
                        <ul className="score-board-list">
                            { this.getTopScoreElement() }
                        </ul>
                    </div>
                </div>

                <div className="main-body-wrapper">
                    <div className="main-content">
                        { endgame }
                    </div>
                    { fullScreenBtn }
                </div>

                <span className="controls" >
                    { logo }
                </span>
                <canvas ref="canvas"
                    width={this.state.screen.width * this.state.screen.ratio}
                    height={this.state.screen.height * this.state.screen.ratio}
                />
                
                { pseudoControl }
                { this.joystickRender }
                { this.fireButtonRender }
                { controlsToolTips }
            </div>
        );
    }

    getRandomAlienTypes() {
        this.numbers = [1, 2, 3, 4];
        let iteration = 1;
  
        return function() {
            if (iteration <= 4) {
                const index = Math.floor(Math.random() * this.numbers.length);
                const number = this.numbers.splice(index, 1)[0];

                iteration++;
              
                return number;
            } else {
                return Math.floor(Math.random() * 4) + 1;
            }
        };
    }

    // Usage:
    getRandomAlienType = this.getRandomAlienTypes();
}
