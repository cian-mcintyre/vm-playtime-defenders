import Particle from './Particle';
import ScoreParticle from './ScoreParticle';
import { asteroidVertices, randomNumBetween, randomOneOfTwo } from './helpers';
import Images from './Images_UFO';

export default class Ufo {
    constructor(args) {
        this.position = args.position;
        this.velocity = {
            x: randomOneOfTwo(-args.speed, args.speed),
            y: randomNumBetween(-args.speed, args.speed),
        };
        this.radius = args.size;
        this.speed = args.speed;
        this.baseSize = args.baseSize;
        this.glowRadius = args.size * 1.5;
        this.score = 500;
        this.create = args.create;
        this.generateUfo = args.generateUfo;
        this.addScore = args.addScore;
        this.vertices = asteroidVertices(4, args.size);

        this.imageIndex = 0; // Index of the current asteroid image
        this.imageTimer = 0; // Timer to control image animation
        this.imageInterval = 25; // Time interval (in milliseconds) between image changes

        this.ufoGlowColor = '198, 193, 255';

        this.ufoImgFrame1 = new Image();
        this.ufoImgFrame2 = new Image();
        this.ufoImgFrame3 = new Image();
        this.ufoImgFrame4 = new Image();
        
        this.ufoImgFrame1.src = Images.UFO_frame_1;
        this.ufoImgFrame2.src = Images.UFO_frame_2;
        this.ufoImgFrame3.src = Images.UFO_frame_3;
        this.ufoImgFrame4.src = Images.UFO_frame_4;

        this.ufoImgAnimation = [this.ufoImgFrame1, this.ufoImgFrame2, this.ufoImgFrame3, this.ufoImgFrame4];

        this.destroyed = false;
    }

    destroy() {
        if (this.destroyed) {
            return;
        }
        
        this.destroyed = true;
        
        this.generateUfo();

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

            glow.addColorStop(0, 'rgba(' + this.ufoGlowColor +', 0.3)');
            glow.addColorStop(1, 'rgba(' + this.ufoGlowColor +', 0)');

            context.fillStyle = glow;
            context.fillRect(-this.glowRadius, -this.glowRadius, this.glowRadius*2, this.glowRadius*2);

            context.drawImage(this.ufoImgAnimation[this.imageIndex], -this.radius, -this.radius, this.radius*2, this.radius*2);
            context.restore();
        }

        this.updateImage();
    }

    updateImage() {
        this.imageTimer += 1;

        if (this.imageTimer >= this.imageInterval) {
            this.imageIndex = (this.imageIndex + 1) % this.ufoImgAnimation.length;
            this.imageTimer = 0;
        }
    }
}


