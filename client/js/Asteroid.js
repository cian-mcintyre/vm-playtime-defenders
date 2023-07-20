import Particle from './Particle';
import { asteroidVertices, randomNumBetween } from './helpers';
import Images from './Images';

export default class Asteroid {
    constructor(args) {
        this.position = args.position
        this.velocity = {
            x: randomNumBetween(-1.5, 1.5),
            y: randomNumBetween(-1.5, 1.5)
        };
        this.rotation = 0;
        this.rotationSpeed = randomNumBetween(-1, 1)
        this.radius = args.size;
        this.score = (80/this.radius)*5;
        this.create = args.create;
        this.addScore = args.addScore;
        this.vertices = asteroidVertices(4, args.size);
        this.firstAsteroidImg = new Image();
        this.firstAsteroidImg.src = Images.asteroid;
        this.firstAsteroidImg2 = new Image();
        this.firstAsteroidImg2.src = Images.asteroid2;
        this.secondAsteroidImg = new Image();
        this.secondAsteroidImg.src = Images.asteroid_secondary;
        this.secondAsteroidImg2 = new Image();
        this.secondAsteroidImg2.src = Images.asteroid_secondary2;
        this.thirdAsteroidImg = new Image();
        this.thirdAsteroidImg.src = Images.asteroid_third;
        this.thirdAsteroidImg2 = new Image();
        this.thirdAsteroidImg2.src = Images.asteroid_third2;
        this.fourthAsteroidImg = new Image();
        this.fourthAsteroidImg.src = Images.asteroid_fourth;  
        this.fourthAsteroidImg2 = new Image();
        this.fourthAsteroidImg2.src = Images.asteroid_fourth2;  

        this.imageIndex = 0; // Index of the current asteroid image
        this.imageTimer = 0; // Timer to control image animation
        this.imageInterval = 100; // Time interval (in milliseconds) between image changes
    
        this.firstAsteroidAnimation = [
            this.firstAsteroidImg,
            this.firstAsteroidImg2
        ];

        this.secondAsteroidAnimation = [
            this.secondAsteroidImg,
            this.secondAsteroidImg2
        ];

        this.thirdAsteroidAnimation = [
            this.thirdAsteroidImg,
            this.thirdAsteroidImg2
        ];

        this.fourthAsteroidAnimation = [
            this.fourthAsteroidImg,
            this.fourthAsteroidImg2
        ];

    }

    destroy(){
        this.delete = true;
        this.addScore(this.score);

        // Explode
        for (let i = 0; i < this.radius; i++) {
            const particle = new Particle({
                lifeSpan: randomNumBetween(60, 100),
                size: randomNumBetween(1, 3),
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

        // Break into smaller asteroids
        if(this.radius > 10){
            for (let i = 0; i < 2; i++) {
                const asteroid = new Asteroid({

                    size: this.radius/2,
                    position: {
                        x: randomNumBetween(-10, 20)+this.position.x,
                        y: randomNumBetween(-10, 20)+this.position.y
                    },
                    create: this.create.bind(this),
                    addScore: this.addScore.bind(this)
                });

                this.create(asteroid, 'asteroids');
            }
        }
    }

    render(state){
    // Move
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Rotation
        this.rotation += this.rotationSpeed;

        if (this.rotation >= 360) {
            this.rotation -= 360;
        }

        if (this.rotation < 0) {
            this.rotation += 360;
        }

        // Screen edges
        if(this.position.x > state.screen.width + this.radius) {this.position.x = -this.radius;}
        else if(this.position.x < -this.radius) {this.position.x = state.screen.width + this.radius;}

        if(this.position.y > state.screen.height + this.radius) {this.position.y = -this.radius;}
        else if(this.position.y < -this.radius) {this.position.y = state.screen.height + this.radius;}


        this.drawAsteroidImg(state);
        this.updateImage();

    }

    drawAsteroidImg(state) {
    // Draw
        const context = state.context;

        if(context) {
            context.save();
            context.translate(this.position.x, this.position.y);
            //context.rotate(this.rotation * Math.PI / 180);

            var astImg;// = this.radius > 40 ? this.firstAsteroidImg : this.secondAsteroidImg
            //context.moveTo(0, -this.radius);
            //context.drawImage(astImg, 0, -this.radius, this.radius, this.radius);
            //console.log("this.radius", this.radius)

      
      
            // context.drawImage(currentImage, -this.radius, 0, this.radius * 2, this.radius * 2);

            switch (this.radius) {
                case 80:
                    astImg = this.firstAsteroidAnimation[this.imageIndex];
                    context.drawImage(astImg, -this.radius, 0, this.radius, this.radius); 
                    break;
                case 40:
                    astImg = this.secondAsteroidAnimation[this.imageIndex];
                    context.drawImage(astImg,-this.radius, 0, this.radius * 2 , this.radius * 2 );
                    break;
                case 20:  
                    astImg = this.thirdAsteroidAnimation[this.imageIndex];
                    context.drawImage(astImg, -this.radius, 0, this.radius*4, this.radius * 4 ); //2
                    break;
                default:
                    astImg = this.fourthAsteroidAnimation[this.imageIndex];
                    context.drawImage(astImg, -this.radius, 0, this.radius*8, this.radius * 8); //2 
            }
  
            //context.drawImage(astImg, -50/2, -50/2, 2.5 * this.radius, 2 * this.radius);
            //context.drawImage(astImg, -50/2, -50/2, 3 * this.radius, 2.5 * this.radius);
            /*context.strokeStyle = '#FFF';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, -this.radius);
      for (let i = 1; i < this.vertices.length; i++) {
        context.lineTo(this.vertices[i].x, this.vertices[i].y);
      }
      context.closePath();
      context.stroke();
      */
            context.restore();
        }
    }

    updateImage() {
        this.imageTimer += 1;

        if (this.imageTimer >= this.imageInterval) {
            this.imageIndex = (this.imageIndex + 1) % this.firstAsteroidAnimation.length;
            this.imageTimer = 0;
        }
    }

}
