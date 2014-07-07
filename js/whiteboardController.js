$(document).ready(function(){

window.whiteboardController = function(){
	this.socket = null;
	this.whiteboard = null;
	this.currentLine = null;

	this.clientQueue = [];
	this.serverQueue = [];
	this.clientQueueInterval = null;
	this.serverQueueInterval = null;

	this.intervalTime = 100;
	this.sampleRate = 10;
	this.pointCount = 10;
}

whiteboardController.prototype.init = function(){
	var urlWhiteboardId = document.location.pathname.split('whiteboard/')[1];
	// This needs to be changed.
	this.socket = io.connect('localhost:3000');
	this.setListeners();
	this.sNewUser(urlWhiteboardId);
	whiteboardView.canvasObj.on("mousedown", this.cDraw.bind(this));
}

whiteboardController.prototype.addClientQueue = function(line, isPartial){
	if (isPartial){
		if (this.pointCount === 0){
			this.clientQueue.push(line);
			this.pointCount = this.sampleRate;
		} else {
			this.pointCount--;
		}
	} else {
		this.clientQueue.push(line);
	}
}

whiteboardController.prototype.clientQueueManager = function(){
	clearInterval(this.clientQueueInterval);
	var that = this;
	while (this.clientQueue.length > 0){
		this.sDraw(this.clientQueue[0]);
		this.clientQueue.shift();
	}
	this.clientQueueInterval = setInterval(function(){that.clientQueueManager()}, this.intervalTime);
}

whiteboardController.prototype.serverQueueManager = function(){
	clearInterval(this.serverQueueInterval);
	var that = this;
	while (this.serverQueue.length > 0){
		var newLine = new lineModel(this.serverQueue.id, this.serverQueue.points);
		this.whiteboard.addLine(newLine);
		this.serverQueue.shift();
	}
	this.serverQueueInterval = setInterval(function(){that.serverQueueManager()}, this.intervalTime);
}

whiteboardController.prototype.sNewUser = function(id){
	this.socket.emit('new user', { whiteboardId: id });
}

whiteboardController.prototype.sDraw = function(line){
	this.socket.emit('draw', {line: {color: 'black', data: line.points}});
}

whiteboardController.prototype.setListeners = function(){
	var that = this;

	this.socket.on('you joined', function(data){
		that.whiteboard = new whiteboardModel(data.whiteboardId);
		that.clientQueueInterval = setInterval(function(){that.clientQueueManager()}, this.intervalTime);
		that.serverQueueInterval = setInterval(function(){that.serverQueueManager()}, this.intervalTime);
	});

	this.socket.on('sync', function(data){
		for (var i=0;i<data.length;i++){
			var serverLine = data[i];
			var line = new lineModel(serverLine.id, serverLine.data);
			that.whiteboard.addLine(line);
		}
	});

	this.socket.on('draw', function(data){
		var line = new lineModel(data.line.id, data.line.data);
		that.whiteboard.addLine(line);
	});
}

whiteboardController.prototype.cDraw = function(event){
	this.currentLine = new lineModel();
	var that = this;
	whiteboardView.canvasObj.bind("mousemove", function(event){
		that.currentLine.addPoint({x: whiteboardView.getX(event.pageX), y: whiteboardView.getY(event.pageY)});
		that.addClientQueue(that.currentLine, true);
	});
	whiteboardView.canvasObj.bind("mouseup", this.endDraw.bind(this));
	whiteboardView.canvasObj.bind("mouseout", this.endDraw.bind(this));
}

whiteboardController.prototype.endDraw = function(event){
	whiteboardView.canvasObj.unbind("mousemove");
	whiteboardView.canvasObj.unbind("mouseup");
	whiteboardView.canvasObj.unbind("mouseout");

	this.whiteboard.addLine(this.currentLine);
	this.addClientQueue(this.currentLine, false);
	this.currentLine = null;
}
});