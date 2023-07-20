import Images from './Images_Aliens';

export default class Particle {
    constructor(args) {
        this.position = args.position;
        this.velocity = args.velocity;
        this.radius = args.size;
        this.lifeSpan = args.lifeSpan;
        this.inertia = 0.98;
        this.type = args.type;

        this.explosionImgFrame1 = new Image();
        this.explosionImgFrame2 = new Image();
        this.explosionImgFrame3 = new Image();
        this.explosionImgFrame4 = new Image();
        this.explosionImgFrame5 = new Image();
        this.explosionImgFrame6 = new Image();
        this.explosionImgFrame7 = new Image();
        this.explosionImgFrame8 = new Image();
        this.explosionImgFrame1.src = Images.explosion1;
        this.explosionImgFrame2.src = Images.explosion2;
        this.explosionImgFrame3.src = Images.explosion3;
        this.explosionImgFrame4.src = Images.explosion4;
        this.explosionImgFrame5.src = Images.explosion5;
        this.explosionImgFrame6.src = Images.explosion6;
        this.explosionImgFrame7.src = Images.explosion7;
        this.explosionImgFrame8.src = Images.explosion8;

        this.explosionImgAnimation = [
            this.explosionImgFrame1,
            this.explosionImgFrame2,
            this.explosionImgFrame3,
            this.explosionImgFrame4,
            this.explosionImgFrame5,
            this.explosionImgFrame6,
            this.explosionImgFrame7,
            this.explosionImgFrame8
        ];

        this.currentFrameIndex = 0;
        this.frameChangeInterval = 3; // Change frame every 3 frames
        this.frameChangeCounter = 0;
        this.animationComplete = false; // Flag to track if animation is complete
    }

    destroy() {
        this.delete = true;
    }

    render(state) {
        // Move
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.x *= this.inertia;
        this.velocity.y *= this.inertia;

        // Shrink
        this.radius -= 0.1;

        if (this.radius < 0.1) {
            this.radius = 0.1;
        }

        if (this.lifeSpan-- < 0) {
            this.destroy();
        }

        // Draw
        const context = state.context;

        if (this.type === 'ship') {
            context.save();
            context.translate(this.position.x, this.position.y);
            context.fillStyle = '#ffffff';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(0, -this.radius);
            context.arc(0, 0, this.radius, 0, 2 * Math.PI);
            context.closePath();
            context.fill();
            context.restore();
        } else {
            if (!this.animationComplete) {
                if (this.frameChangeCounter >= this.frameChangeInterval) {
                    this.currentFrameIndex++;
    
                    if (this.currentFrameIndex >= this.explosionImgAnimation.length-1) {
                        this.animationComplete = true;
                        // Add code here to handle animation completion
                    }
    
                    this.frameChangeCounter = 0;
                } else {
                    this.frameChangeCounter++;
                }
    
                const currentFrame = this.explosionImgAnimation[this.currentFrameIndex];
                const frameWidth = currentFrame.width;
                const frameHeight = currentFrame.height;
    
                context.drawImage(
                    currentFrame,
                    this.position.x - frameWidth / 2,
                    this.position.y - frameHeight / 2,
                    frameWidth,
                    frameHeight
                );
            }
        }
    }
}
