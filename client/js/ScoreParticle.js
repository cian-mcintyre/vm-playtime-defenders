export default class ScoreParticle {
    constructor(args) {
        this.position = args.position;
        this.score = args.score;
        this.lifeSpan = 60;
        this.velocity = {
            x: 0,
            y: -1,
        };
        this.delete = false;
    }

    render(state) {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.lifeSpan--;

        if (this.lifeSpan <= 0) {
            this.delete = true;
        }

        const context = state.context;

        if (context) {
            context.save();
            context.translate(this.position.x, this.position.y);
            context.fillStyle = '#f4ed1b';
            context.font = '16px Technomat';
            context.fillText(this.score, 0, 0);
            context.restore();
        }
    }
}
