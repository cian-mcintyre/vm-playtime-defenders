import Particle from './Particle';
import ScoreParticle from './ScoreParticle';
import { asteroidVertices, randomNumBetween } from './helpers';
import Images from './Images_InfinityBox';

export default class InfinityBox {
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
        this.score = 'Rapid Fire';
        this.create = args.create;
        this.generateInfinityBox = args.generateInfinityBox;
        this.setRapidFire = args.setRapidFire;
        this.addScore = args.addScore;
        this.vertices = asteroidVertices(4, args.size);

        this.imageIndex = 0; // Index of the current asteroid image
        this.imageTimer = 0; // Timer to control image animation
        this.imageInterval = 25; // Time interval (in milliseconds) between image changes

        this.infinityBoxGlowColor = '255, 233, 199';

        this.infinityBoxImgFrame1 = new Image();
        this.infinityBoxImgFrame2 = new Image();
        
        this.infinityBoxImgFrame1.src = Images.infinity_box_frame_1;
        this.infinityBoxImgFrame2.src = Images.infinity_box_frame_2;

        this.infinityBoxImgAnimation = [this.infinityBoxImgFrame1, this.infinityBoxImgFrame2];

        this.destroyed = false;
    }

    destroy() {
        if (this.destroyed) {
            return;
        }
        
        this.destroyed = true;
        
        this.generateInfinityBox();

        this.delete = true;

        this.setRapidFire();

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

            glow.addColorStop(0, 'rgba(' + this.infinityBoxGlowColor +', 0.3)');
            glow.addColorStop(1, 'rgba(' + this.infinityBoxGlowColor +', 0)');

            context.fillStyle = glow;
            context.fillRect(-this.glowRadius, -this.glowRadius, this.glowRadius*2, this.glowRadius*2);

            context.drawImage(this.infinityBoxImgAnimation[this.imageIndex], -this.radius, -this.radius, this.radius*2, this.radius*2);
            context.restore();
        }

        this.updateImage();
    }

    updateImage() {
        this.imageTimer += 1;

        if (this.imageTimer >= this.imageInterval) {
            this.imageIndex = (this.imageIndex + 1) % this.infinityBoxImgAnimation.length;
            this.imageTimer = 0;
        }
    }
}


