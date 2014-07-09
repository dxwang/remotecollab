$(document).ready(function(){


/**
 * Client Listener Module
 */
window.clientListener = function(){
	this.element = null;
	this.eventStartHandler = null;
	this.eventContinueHandler = null;
	this.eventEndHandler = null;
}

clientListener.prototype.init = function(element, start, cont, end){
	this.element = element;
	this.eventStartHandler = start;
	this.eventContinueHandler = cont;
	this.eventEndHandler = end;
	$(this.element).on("mousedown", this.mouseStart.bind(this));
}

clientListener.prototype.mouseStart = function(event){
	this.eventStartHandler();
	this.mouseContinue();
}

clientListener.prototype.mouseContinue = function(){
	var mouseContinueFunc = function(event){
		this.eventContinueHandler(event, this.element);
	}
	$(this.element).bind("mousemove", mouseContinueFunc.bind(this));
	$(this.element).bind("mouseup", this.mouseEnd.bind(this));
	$(this.element).bind("mouseout", this.mouseEnd.bind(this));
}

clientListener.prototype.mouseEnd = function(event){
	this.eventEndHandler();
	$(this.element).unbind("mousemove");
	$(this.element).unbind("mouseup");
	$(this.element).unbind("mouseout");
}

/**
 * Line Creator Module
 */
window.lineCreator = function(){
	this.line = null;
	this.clientPush = null;
	this.serverPush = null;
	this.sampleRate = 1;
	this.pointSample = this.sampleRate;
}

lineCreator.prototype.init = function(client, server){
	this.clientPush = client;
	this.serverPush = server;
}

lineCreator.prototype.newLine = function(){
	this.line = new lineModel();
	// this.line.setContext(...);
}

lineCreator.prototype.continueLine = function(data, element){
	this.line.addPoint(this.relativeCoordinateGetter(data.pageX, data.pageY, element));
	this.pointSampler(this.line, false);
}

lineCreator.prototype.endLine = function(){
	this.pointSampler(this.line, true);
	this.line = null;
	this.pointSample = this.sampleRate;
}

lineCreator.prototype.relativeCoordinateGetter = function(pageX, pageY, element){
	var relx = (pageX - element.offsetLeft) * (element.width / element.offsetWidth);
	var rely = (pageY - element.offsetTop) * (element.height / element.offsetHeight);
	return {x: relx, y: rely};
}

lineCreator.prototype.pointSampler = function(line, noSample){
	if (noSample || this.pointSample === 0){
		this.clientPush(line);
		this.serverPush(line);
		this.pointSample = this.sampleRate;
	} else {
		this.pointSample--;
	}
}

/**
 * Server Listener Module
 */
window.serverListener = function(socket){
	this.socket = socket;
	this.lineDataHandler = null;
}

serverListener.prototype.init = function(line, message){
	this.lineHandler = line;
	this.messageHandler = message;
	this.lineCollectionSync();
	this.lineSync();
}

serverListener.prototype.lineCollectionSync = function(){
	var sync = function(data){
		for (var i = 0; i < data.length; i++){
			// this.lineHandler({id: data[i].id, points: data[i].data, context: ???});
			this.lineHandler({id: data[i].id, points: data[i].data});
		}
	};
	this.socket.on("sync", sync.bind(this));
}

serverListener.prototype.lineSync = function(){
	var sync = function(data){
		// this.lineHandler({id: data.line.id, points: data.line.data, context: ???});
		this.lineHandler({id: data.line.id, points: data.line.data});
	}
	this.socket.on("draw", sync.bind(this));
}

/**
 * Server Emitter Module
 */
window.serverEmitter = function(socket){
	this.socket = socket;
}

serverEmitter.prototype.newSession = function(id){
	this.socket.emit('new user', { whiteboardId: id });
}

serverEmitter.prototype.addLine = function(line){
	// this.socket.emit('draw', {line: {color: line.context, data: line.points}});
	this.socket.emit('draw', {line: {color: "black", data: line.points}});
}

/**
 * Queue Sync Manager
 */
window.queueSyncManager = function(){
	this.clientSyncHandler = null;
	this.serverSyncHandler = null;
	this.clientQueue = [];
	this.serverQueue = [];
	this.clientQueueInterval = null;
	this.serverQueueInterval = null;

	this.intervalTime = 1;
}

queueSyncManager.prototype.init = function(client, server){
	this.clientSyncHandler = client;
	this.serverSyncHandler = server;
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.intervalTime);
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.intervalTime);

}

queueSyncManager.prototype.addClientQueue = function(data){
	this.clientQueue.push(data);
}

queueSyncManager.prototype.addServerQueue = function(data){
	this.serverQueue.push(data);
}

queueSyncManager.prototype.clientQueueManager = function(){
	clearInterval(this.clientQueueInterval);
	var that = this;
	while (this.clientQueue.length > 0){
		this.serverSyncHandler(this.clientQueue[0])
		this.clientQueue.shift();
	}
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.intervalTime);
}

queueSyncManager.prototype.serverQueueManager = function(){
	clearInterval(this.serverQueueInterval);
	var that = this;
	while (this.serverQueue.length > 0){
		this.clientSyncHandler(this.serverQueue[0]);
		this.serverQueue.shift(); 
	}
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.intervalTime);
}

window.whiteboardController = function(){
	this.socket = null;
	this.whiteboardView = null;
	this.whiteboardModel = null;
	this.whiteboardServerEmitter = null;
	this.whiteboardQueueManager = null;
	this.whiteboardServerListener = null;
	this.whiteboardLineCreator = null;
	this.whiteboardClientListener = null;
}

whiteboardController.prototype.init = function(element){
	this.socket = io.connect('localhost:3000');
	this.whiteboardView = new whiteboardView();
	this.whiteboardView.init(element);
	this.whiteboardModel = new whiteboardModel(this.whiteboardView.draw.bind(this.whiteboardView));
	this.whiteboardServerEmitter = new serverEmitter(this.socket);
	this.whiteboardQueueManager = new queueSyncManager();
	this.whiteboardQueueManager.init(
		this.whiteboardModel.addLine.bind(this.whiteboardModel), 
		this.whiteboardServerEmitter.addLine.bind(this.whiteboardServerEmitter)
	);
	this.whiteboardServerListener = new serverListener(this.socket);
	this.whiteboardServerListener.init(
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager)
	);
	this.whiteboardLineCreator = new lineCreator();
	this.whiteboardLineCreator.init(
		this.whiteboardQueueManager.addClientQueue.bind(this.whiteboardQueueManager), 
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager)
	);
	this.whiteboardClientListener = new clientListener();
	this.whiteboardClientListener.init(
		element,
		this.whiteboardLineCreator.newLine.bind(this.whiteboardLineCreator),
		this.whiteboardLineCreator.continueLine.bind(this.whiteboardLineCreator),
		this.whiteboardLineCreator.endLine.bind(this.whiteboardLineCreator) 
	);
	this.whiteboardServerEmitter.newSession(document.location.pathname.split('whiteboard/')[1]);
}
});
