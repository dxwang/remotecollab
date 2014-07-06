$(document).ready(function(){

/**
 * Line Model
 */
window.lineModel = function(serverId, points){
	this.id = serverId || Date.now();
	this.points = points || [];
}

lineModel.prototype.getId = function(){
	return this.id;
}

lineModel.prototype.getLine = function(){
	return this.points;
}

lineModel.prototype.addPoint = function(coord){
	this.points.push(coord);
	whiteboardView.draw(this.points);
}

/**
 * User Model
 */
window.userModel = function(serverId, messages){
	this.id = serverId;
	this.messages = messages || {};
}

userModel.prototype.getId = function(){
	return this.id;
}

userModel.prototype.addMessage = function(message){
	this.messages[Date.now()] = message
}

/**
 * Whiteboard Model
 */
window.whiteboardModel = function(serverId){
	this.id = serverId;
	this.lines = [];
}

whiteboardModel.prototype.getId = function(){
	return this.id;
}

whiteboardModel.prototype.addLine = function(line){
	this.lines.push(line);
	whiteboardView.draw(line.points);
}

});