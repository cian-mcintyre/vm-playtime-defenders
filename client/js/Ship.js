import Bullet from './Bullet';
import Particle from './Particle';
import { rotatePoint, randomNumBetween } from './helpers';
import Images from './Images';
import sounds from './Sounds';

export default class Ship {
    constructor(args) {
        this.position = args.position;
        this.shipSize = args.shipSize;
        this.velocity = {
            x: 0,
            y: 0
        };
        this.rotation = 0;
        this.rotationSpeed = 6;
        this.joystickRotationSpeed = 3;
        this.speed = args.speed || 0.15;
        this.baseSpeed = args.speed;
        this.bulletSpeedCoeff = args.bulletSpeedCoeff;
        this.inertia = 0.99;
        this.radius = args.shipSize * 0.40;
        this.lastShot = 0;
        this.create = args.create;
        this.onDie = args.onDie;
        this.shipImage = new Image();
        this.shipImage.src = Images.ship;
        this.isRapidFire = false;
    }

    destroy(){
        sounds.engine.reset();

        this.delete = true;
        this.onDie();

        // Explode
        for (let i = 0; i < 60; i++) {
            const particle = new Particle({
                lifeSpan: randomNumBetween(60, 100),
                size: randomNumBetween(1, 4),
                position: {
                    x: this.position.x + randomNumBetween(-this.radius/4, this.radius/4),
                    y: this.position.y + randomNumBetween(-this.radius/4, this.radius/4)
                },
                velocity: {
                    x: randomNumBetween(-1.5, 1.5),
                    y: randomNumBetween(-1.5, 1.5)
                }
            });

            this.create(particle, 'particles');
        }
    }

    rotate(dir){
        if (dir == 'LEFT') {
            this.rotation -= this.rotationSpeed;
        }

        if (dir == 'RIGHT') {
            this.rotation += this.rotationSpeed;
        }
    }

    joystickRotate(degree) {
        let normalizedDegree = 90 - Math.round(degree);

        if (normalizedDegree >= 360) {
            normalizedDegree -= 360;
        }

        if (normalizedDegree < 0) {
            normalizedDegree += 360;
        }

        const isSmoothRotation = (this.rotation > normalizedDegree) && (this.rotation - normalizedDegree < 30)
            || (this.rotation < normalizedDegree) && (normalizedDegree - this.rotation < 30);

        if (isSmoothRotation) {
            this.joystickRotationSpeed = 6;
        } else {
            this.joystickRotationSpeed = 12;
        }
    
        if (
            (normalizedDegree > this.rotation + this.joystickRotationSpeed)
                && (normalizedDegree < 270 || this.rotation > 90)
                || (normalizedDegree < 90 && this.rotation > 270)
        ) {
            this.rotation += this.joystickRotationSpeed;
        } else if (
            normalizedDegree < this.rotation - this.joystickRotationSpeed
            || normalizedDegree >= 270 && this.rotation <= 90
        ) {
            this.rotation -= this.joystickRotationSpeed;
        } else {
            this.rotation = normalizedDegree;
        }
    }

    accelerate(){
        this.velocity.x -= Math.sin(-this.rotation*Math.PI/180) * this.speed;
        this.velocity.y -= Math.cos(-this.rotation*Math.PI/180) * this.speed;

        // Thruster particles
        const thrustersConfid = [
            {x:-this.shipSize/4, y:-this.shipSize/4, rotationCorection: 160},
            {x:this.shipSize/4, y:-this.shipSize/4, rotationCorection: 200}
        ];

        thrustersConfid.forEach(thrasterConfig => {
            const posDelta1 = rotatePoint(
                {x:thrasterConfig.x,y:thrasterConfig.y},
                {x:0,y:0},
                (this.rotation-thrasterConfig.rotationCorection) * Math.PI / 180
            );
            const particle1 = new Particle({
                lifeSpan: randomNumBetween((this.shipSize/2) - (this.shipSize/2)*0.1, (this.shipSize/2) + (this.shipSize/2)*0.1),
                size: randomNumBetween(1, 3),
                type: 'ship',
                position: {
                    x: this.position.x + posDelta1.x + randomNumBetween(-2, 2),
                    y: this.position.y + posDelta1.y + randomNumBetween(-2, 2)
                },
                velocity: {
                    x: posDelta1.x / randomNumBetween(3, 5),
                    y: posDelta1.y / randomNumBetween(3, 5)
                }
            });

            this.create(particle1, 'particles');
        });

        sounds.engine.play();
    }

    render(state){
        const fireRate = this.isRapidFire ? 100 : 300;

        // joystic control
        if (!state.keys.up && state.shipPosition) {
            if (state.shipPosition.angle) {
                this.joystickRotate(state.shipPosition.angle.degree);
            }

            if (state.shipPosition.force > 0) {
                this.speed = state.shipPosition.force < (this.baseSpeed * 10) ? state.shipPosition.force / 10 : this.baseSpeed;

                sounds.engine.setVolume(this.speed < 0.1 ? this.speed * 10 : 1);

                this.accelerate();
            } else {
                this.speed = this.baseSpeed;

                sounds.engine.reset();
            }
        }

        if (state.fireControl) {
            if (state.fireControl.fire && Date.now() - this.lastShot > fireRate){
                const bullet = new Bullet({ship: this});

                this.create(bullet, 'bullets');
                sounds.bullets.instantPlay();
                this.lastShot = Date.now();
            }
        }

        // Controls
        if(state.keys.up){
            this.accelerate(1);
        } else if (!state.shipPosition) {
            sounds.engine.reset();
        }

        if(state.keys.left){
            this.rotate('LEFT');
        }

        if(state.keys.right){
            this.rotate('RIGHT');
        }

        if(state.keys.space && Date.now() - this.lastShot > fireRate){
            const bullet = new Bullet({ship: this});

            this.create(bullet, 'bullets');
            sounds.bullets.instantPlay();
            this.lastShot = Date.now();
        }

        // Move
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.x *= this.inertia;
        this.velocity.y *= this.inertia;

        // Rotation
        if (this.rotation >= 360) {
            this.rotation -= 360;
        }

        if (this.rotation < 0) {
            this.rotation += 360;
        }

        // Screen edges
        if(this.position.x > state.screen.width) {this.position.x = 0;}
        else if(this.position.x < 0) {this.position.x = state.screen.width;}

        if(this.position.y > state.screen.height) {this.position.y = 0;}
        else if(this.position.y < 0) {this.position.y = state.screen.height;}

        //this.shipImage.onload = this.drawShipImage.bind(this);
        this.drawShipImage(state);
    }

    drawShipImage(state){
        const context = state.context;

        if (context) {
            context.save();
            context.translate(this.position.x, this.position.y);
            context.rotate(this.rotation * Math.PI / 180);
            context.drawImage(this.shipImage, -this.shipSize/2, -this.shipSize/2, this.shipSize, this.shipSize);
            context.strokeStyle = '#ffffff';
            context.fill();
            context.stroke();
            context.restore();
        }
    }
}
