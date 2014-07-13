$(document).ready(function(){

window.whiteboardModel = {
	currentLine: [],
	currentLineId: null,
	lines: {},
	whiteboardId: null,
	userId: null,
	socket: null,

	init: function(){
		// Logic to get whiteboard Id from URL
		// TODO: Why is this always set to 1?
		this.whiteboardId = 1;
		this.socket = io.connect('ec2-54-85-43-74.compute-1.amazonaws.com:3000');
		//this.socket = io.connect('localhost:3000');
		this.socket.emit('new user', { whiteboardId: this.whiteboardId});
		this.socketListeners();
	},

	socketListeners: function(){
		var that = this;

		this.socket.on('you joined', function(data){
			that.whiteboardId = data.whiteboardId;
		});

		this.socket.on('sync', function(data){
			for (var i=0;i<data.length;i++){
				var line = data[i];
				whiteboardModel.updateLine(line.id, line.data);
			}
		});

		this.socket.on('draw', function(data){
			whiteboardModel.updateLine(data.line.id, data.line.data);
		});

		this.socket.on('line added', function(data){
			that.currentLineId = data.id;
			whiteboardModel.updateLine(that.currentLineId, that.currentLine);

		});
	},

	updateLine: function(id, line){
		this.lines[id] = line;
		whiteboardView.draw(line);
	},

	addPointToCurrentLine: function(coordinates){
		// if (this.currentLineId === null){
		// 	// API Call to get an Id for the current line
		// 	whiteboardModel.mockGetNewLineId();
		// }
		this.currentLine.push({x: coordinates[0], y: coordinates[1]});
		this.socket.emit('draw', {line: {color: 'black', data: this.currentLine}});
		// whiteboardModel.updateLine(this.currentLineId, this.currentLine);
		// API call to submit line, with line id
		// whiteboardModel.mockAddLine(this.currentLineId, this.currentLine);
	},

	endCurrentLine: function(){
		this.currentLine = [];
		this.currentLineId = null;
	}
};
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
