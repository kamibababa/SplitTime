namespace SplitTime.body.collisions {
    
    export class Sliding {
        mover: Mover;
        constructor(mover: SplitTime.body.Mover) {
            this.mover = mover;
        }
        
        /**
        *
        * @param {number} maxDistance
        */
        zeldaSlide(maxDistance) {
            if(this.mover.bodyExt.sliding) {
                return;
            }
            
            this.mover.bodyExt.sliding = true;
            
            var halfBase = Math.round(this.mover.body.baseLength / 2);
            
            var x = Math.floor(this.mover.body.getX());
            var y = Math.floor(this.mover.body.getY());
            var z = Math.floor(this.mover.body.getZ());
            
            var dist = maxDistance; //Math.min(1, maxDistance);
            
            // Closest diagonal direction positive angle from current direction
            var positiveDiagonal = (Math.round(this.mover.body.dir + 1.1) - 0.5) % 4;
            // Closest diagonal direction negative angle from current direction
            var negativeDiagonal = (Math.round(this.mover.body.dir + 3.9) - 0.5) % 4;
            
            var me = this;
            var levelTraces = this.mover.level.getLevelTraces();
            function isCornerOpen(direction, howFarAway) {
                var collisionInfo = new SplitTime.level.traces.CollisionInfo();
                var testX = x + SplitTime.Direction.getXSign(direction) * (halfBase + howFarAway);
                var testY = y + SplitTime.Direction.getYSign(direction) * (halfBase + howFarAway);
                levelTraces.calculatePixelColumnCollisionInfo(collisionInfo, testX, testY, me.mover.body.z, me.mover.body.z + me.mover.body.height);
                return !collisionInfo.containsSolid;
            }
            
            for(var howFarOut = 1; howFarOut <= 5; howFarOut++) {
                var isCorner1Open = isCornerOpen(positiveDiagonal, howFarOut);
                var isCorner2Open = isCornerOpen(negativeDiagonal, howFarOut);
                if(isCorner1Open && !isCorner2Open) {
                    this.mover.zeldaBump(dist, positiveDiagonal);
                    break;
                } else if(isCorner2Open && !isCorner1Open) {
                    this.mover.zeldaBump(dist, negativeDiagonal);
                    break;
                }
            }
            
            this.mover.bodyExt.sliding = false;
        };
    }
}