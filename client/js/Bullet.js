import { rotatePoint } from './helpers';
import Images from './Images';

export default class Bullet {
    constructor(args) {
        const posDelta = rotatePoint({x:0, y:-20}, {x:0,y:0}, args.ship.rotation * Math.PI / 180);

        this.position = {
            x: args.ship.position.x + posDelta.x,
            y: args.ship.position.y + posDelta.y
        };
        this.rotation = args.ship.rotation;
        this.velocity = {
            x:posDelta.x * args.ship.bulletSpeedCoeff,
            y:posDelta.y * args.ship.bulletSpeedCoeff
        };
        this.radius = 2;

        this.bulletImg = new Image();
        this.bulletImg.src = Images.bullet;
    }

    destroy(){
        this.delete = true;
    }

    render(state){
    // Move
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Delete if it goes out of bounds
        if ( this.position.x < 0
      || this.position.y < 0
      || this.position.x > state.screen.width
      || this.position.y > state.screen.height ) {
            this.destroy();
        }

        // Draw
        const context = state.context;

        context.save();
        context.translate(this.position.x, this.position.y);
        context.rotate(this.rotation * Math.PI / 180);
        //context.fillStyle = '#FFF';
        //context.lineWidth = 0,5;
        //context.beginPath();
        //context.arc(0, 0, 2, 0, 2 * Math.PI);
        //context.closePath();
        //context.fill();
        context.drawImage(this.bulletImg, -this.radius, 0, 12, 12);
        context.restore();
    }
}
