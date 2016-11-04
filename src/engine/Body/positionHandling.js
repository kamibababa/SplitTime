dependsOn("Body.js");

SplitTime.Body.prototype.positions = {};
SplitTime.Body.prototype.positionCount = 0;

SplitTime.Body.prototype.getPosition = function(id) {
    if(id in this.positions) {
        return this.positions[alias];
    }
    else {
        return SplitTime.Level.get(this.lvl).getPosition(id);
    }
};

SplitTime.Body.prototype.putInPosition = function(position) {
    if(!position) return;

    this.put(position.levelId, position.x, position.y, position.layer);
    this.dir = position.dir;
    this.requestStance(position.stance);
};

SplitTime.Body.prototype.registerPosition = function(alias, position) {
    if(this.positionCount === 0) {
        this.positions = {};
    }
    this.positions[alias] = position;
};