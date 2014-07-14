$(document).ready(function(){

/**
 * Line Model
 * NEEDS A BUNCH OF CONTEXT METHODS
 */
window.lineModel = function(serverId, points, context){
	console.log(serverId);
	this.id = serverId || '';
	this.id += Date.now();
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
window.whiteboardModel = function(drawFunc, clearFunc){
	this.id = Date.now();
	this.lines = [];
	this.currentLine = null;
	this.draw = drawFunc || function(){};
	this.clear = clearFunc || function(){};
};

whiteboardModel.prototype.getId = function(){
	return this.id;
};

whiteboardModel.prototype.getCurrentLine = function(){
	return this.currentLine;
};

whiteboardModel.prototype.newLine = function(context, userId) {
	this.currentLine = new lineModel(userId);
	this.currentLine.setContext(context);
};

whiteboardModel.prototype.continueLine = function(point) {
	this.currentLine.addPoint(point);
	var points = this.currentLine.getLine();
	if(points.length >= 2) {
		var drawPoints = [ points[points.length-2], points[points.length-1] ];
		this.draw(drawPoints, this.currentLine.getContext());
	}
};

whiteboardModel.prototype.endLine = function() {
	this.lines.push(this.currentLine);
	this.currentLine = null;
};

whiteboardModel.prototype.addLine = function(data){
	var line = new lineModel(data.id, data.points, data.context);
	this.lines.push(line);
	this.draw(line.points, line.context);
};

whiteboardModel.prototype.removeLine = function(data){
	for (var i=0;i<this.lines.length;i++){
		if (this.lines[i].id === data){
			this.lines.splice(i, 1);
			break;
		}
	}
};

whiteboardModel.prototype.removeLinesInBounds = function(top, bottom, left, right){
	var removedLines = [];
	var redraw = false;
	for (var i=0;i<this.lines.length;i++){
		var line = this.lines[i];
		for (var j=0;j<line.points.length;j++){
			var point = line.points[j];
			if (point.x <= right && point.x >= left && point.y <= bottom && point.y >= top){
				removedLines.push(line.id);
				this.lines.splice(i, 1);
				i = i - 1;
				redraw = true;
				break;
			}
		}
	}
	if (redraw){
		this.clear();
		for (var k=0;k<this.lines.length;k++){
			var line = this.lines[k];
			this.draw(line.points, line.context);
		}
	}
	
	return removedLines;
}
});