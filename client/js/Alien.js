import Particle from './Particle';
import ScoreParticle from './ScoreParticle';
import { asteroidVertices, randomNumBetween } from './helpers';
import Images from './Images_Aliens';

// RGB color
const aliensColor = {
    alien_type1: '238, 191, 141',
    alien_type2: '237, 157, 245',
    alien_type3: '177, 240, 244',
    alien_type4: '205, 249, 187'
};

export default class Alien {
    constructor(args) {
        this.position = args.position;
        this.velocity = {
            x: randomNumBetween(-args.speed, args.speed),
            y: randomNumBetween(-args.speed, args.speed),
        };
        this.radius = args.size;
        this.speed = args.speed;
        this.baseSize = args.baseSize;
        this.glowRadius = args.size * 1.5;
        this.type = args.type;
        this.score = (120 / this.radius) * 5;
        this.create = args.create;
        this.addScore = args.addScore;
        this.vertices = asteroidVertices(4, args.size);

        this.imageIndex = 0; // Index of the current asteroid image
        this.imageTimer = 0; // Timer to control image animation
        this.imageInterval = 75; // Time interval (in milliseconds) between image changes

        this.alienGlowColor = aliensColor['alien_type' + this.type];

        this.alienImgFrame1 = new Image();
        this.alienImgFrame2 = new Image();
        
        this.alienImgFrame1.src = Images['alien_type' + this.type + '_frame1'];
        this.alienImgFrame2.src = Images['alien_type' + this.type + '_frame2'];

        this.alienImgAnimation = [this.alienImgFrame1, this.alienImgFrame2];

        this.destroyed = false;
    }

    destroy() {
        if (this.destroyed) {
            return;
        }
        
        this.destroyed = true;
        this.delete = true;
        this.addScore(this.score);

        const particle = new Particle({
            lifeSpan: randomNumBetween(60, 100),
            size: 1,
            position: {
                x: this.position.x + randomNumBetween(-this.radius / 4, this.radius / 4),
                y: this.position.y + randomNumBetween(-this.radius / 4, this.radius / 4),
            },
            velocity: {
                x: randomNumBetween(-this.speed, this.speed),
                y: randomNumBetween(-this.speed, this.speed),
            },
        });

        this.create(particle, 'particles');

        if (this.radius > (this.baseSize / 2)) {

            for (let i = 0; i < 2; i++) {
                const alienid = new Alien({
                    type: this.type,
                    size: this.radius / 2,
                    baseSize: this.baseSize,
                    position: {
                        x: randomNumBetween(-10, this.baseSize) + this.position.x,
                        y: randomNumBetween(-10, this.baseSize) + this.position.y,
                    },
                    create: this.create.bind(this),
                    addScore: this.addScore.bind(this),
                    speed: this.speed
                });

                this.create(alienid, 'asteroids');
            }
        }

        const scoreParticle = new ScoreParticle({
            position: { x: this.position.x, y: this.position.y },
            score: this.score,
        });

        this.create(scoreParticle, 'particles');
    }

    render(state) {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.x > state.screen.width + this.radius) {
            this.position.x = -this.radius;
        } else if (this.position.x < -this.radius) {
            this.position.x = state.screen.width + this.radius;
        }

        if (this.position.y > state.screen.height + this.radius) {
            this.position.y = -this.radius;
        } else if (this.position.y < -this.radius) {
            this.position.y = state.screen.height + this.radius;
        }

        const context = state.context;

        if (context) {
            context.save();
            context.translate(this.position.x, this.position.y);

            // Create radial darck glow
            const glow = context.createRadialGradient(
                0,
                0,
                this.glowRadius/4,
                0,
                0,
                this.glowRadius
            );

            glow.addColorStop(0, 'rgba(' + this.alienGlowColor +', 0.3)');
            glow.addColorStop(1, 'rgba(' + this.alienGlowColor +', 0)');

            context.fillStyle = glow;
            context.fillRect(-this.glowRadius, -this.glowRadius, this.glowRadius*2, this.glowRadius*2);

            context.drawImage(this.alienImgAnimation[this.imageIndex], -this.radius, -this.radius, this.radius*2, this.radius*2);
            /*
            context.strokeStyle = '#FFF';
            context.lineWidth = 2;
            context.beginPath();
            
            for (let i = 0; i < this.vertices.length; i++) {
                context.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            
            context.closePath();
            context.stroke();*/
            context.restore();
            
        }

        this.updateImage();
    }

    updateImage() {
        this.imageTimer += 1;

        if (this.imageTimer >= this.imageInterval) {
            this.imageIndex = (this.imageIndex + 1) % this.alienImgAnimation.length;
            this.imageTimer = 0;
        }
    }
}


