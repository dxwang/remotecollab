$(document).ready(function(){

/**
 * Line Model
 * NEEDS A BUNCH OF CONTEXT METHODS
 */
window.lineModel = function(serverId, points, context){
	this.id = serverId || Date.now();
	this.points = points || [];
	this.context = context || {color: "black", width: "1"};
}

lineModel.prototype.getId = function(){
	return this.id;
}

lineModel.prototype.getLine = function(){
	return this.points;
}

lineModel.prototype.addPoint = function(coord){
	this.points.push(coord);
}

lineModel.prototype.getContext = function(){
	return this.context;
}

lineModel.prototype.setContext = function(context){
	this.context.color = context.color;
	this.context.width = context.width;
}

/**
 * User Model
 */
window.userModel = function(serverId, messages){
	this.id = serverId || Date.now();
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
window.whiteboardModel = function(drawFunc){
	this.id = Date.now();
	this.lines = [];
	this.draw = drawFunc || function(){};
}

whiteboardModel.prototype.getId = function(){
	return this.id;
}

whiteboardModel.prototype.addLine = function(data){
	// var line = new lineModel(data.id, data.points, data.context);
	var line = new lineModel(data.id, data.points);
	this.lines.push(line);
	// this.draw(line.context, line.points)
	this.draw(line.points);
}

});