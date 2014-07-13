$(document).ready(function(){

/**
 * Line Model
 * NEEDS A BUNCH OF CONTEXT METHODS
 */
window.lineModel = function(serverId, points, context){
	this.id = serverId || Date.now();
	this.points = points || [];
	this.context = context || {color: "black", width: "1"};
};

lineModel.prototype.getId = function(){
	return this.id;
};

lineModel.prototype.getLine = function(){
	return this.points;
};

lineModel.prototype.addPoint = function(coord){
	this.points.push(coord);
};

lineModel.prototype.getContext = function(){
	return this.context;
};

lineModel.prototype.setContext = function(context){
	this.context.color = context.color;
	this.context.width = context.width;
};

/**
 * Messages Model
 */
window.messagesModel = function(printFunc){
	this.id = Date.now();
	this.messages = {};
	this.print = printFunc;
};

messagesModel.prototype.getId = function(){
	return this.id;
};

messagesModel.prototype.addMessage = function(message){
	this.messages[Date.now()] = message;
	this.print(message);
};

/**
 * Toolbar Model
 */
window.toolbarModel = function(){
	this.id = Date.now();
	this.color = 'black';
	this.width = '1';
};

toolbarModel.prototype.getColor = function(){
	return this.color;
}

toolbarModel.prototype.setColor = function(color){
	this.color = color;
};

toolbarModel.prototype.getWidth = function(){
	return this.width;
}

toolbarModel.prototype.setWidth = function(width){
	this.width = width;
};

toolbarModel.prototype.getContext = function(){
	return {color: this.color, width: this.width};
}

/**
 * Whiteboard Model
 */
window.whiteboardModel = function(drawFunc){
	this.id = Date.now();
	this.lines = [];
	this.currentLine = null;
	this.draw = drawFunc || function(){};
};

whiteboardModel.prototype.getId = function(){
	return this.id;
};

whiteboardModel.prototype.newLine = function(context) {
	this.currentLine = new lineModel();
	this.currentLine.setContext(context);
}

whiteboardModel.prototype.continueLine = function(point) {
	this.currentLine.addPoint(point);
	var points = this.currentLine.getLine();
	if(points.length >= 2) {
		var drawPoints = [ points[points.length-2], points[points.length-1] ];
		this.draw(drawPoints, this.currentLine.getContext());
	}
}

whiteboardModel.prototype.endLine = function() {
	this.lines.push(this.line);
	this.currentLine = null;
}

whiteboardModel.prototype.addLine = function(data){
	var line = new lineModel(data.id, data.points, data.context);
	this.lines.push(line);
	this.draw(line.points, line.context);
};
});