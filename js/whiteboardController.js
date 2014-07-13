$(document).ready(function(){

/**
 * Whiteboard Listener Module
 */
window.whiteboardListener = function(){
	this.element = null;
	this.eventStartHandler = null;
	this.eventContinueHandler = null;
	this.eventEndHandler = null;
};

whiteboardListener.prototype.init = function(element, start, cont, end){
	this.element = element;
	this.eventStartHandler = start;
	this.eventContinueHandler = cont;
	this.eventEndHandler = end;
	$(this.element).on("mousedown", this.mouseStart.bind(this));
};

whiteboardListener.prototype.mouseStart = function(event){
	this.eventStartHandler();
	this.mouseContinue();
};

whiteboardListener.prototype.mouseContinue = function(){
	var mouseContinueFunc = function(event){
		this.eventContinueHandler(event, this.element);
	}
	$(this.element).bind("mousemove", mouseContinueFunc.bind(this));
	$(this.element).bind("mouseup", this.mouseEnd.bind(this));
	$(this.element).bind("mouseout", this.mouseEnd.bind(this));
};

whiteboardListener.prototype.mouseEnd = function(event){
	this.eventEndHandler();
	$(this.element).unbind("mousemove");
	$(this.element).unbind("mouseup");
	$(this.element).unbind("mouseout");
};

/**
 * Chat Event Listener
 */
window.chatListener = function(){
	this.element = null;
	this.inputElement = null;
	this.eventHandler = null;
};

chatListener.prototype.init = function(element, inputElement, eventHandler){
	this.element = element;
	this.inputElement = inputElement;
	this.eventHandler = eventHandler;
	$(this.element).submit(this.submitEvent.bind(this));
};

chatListener.prototype.submitEvent = function(event){
	event.preventDefault();
	var message = $(this.inputElement).val();
	if (message !== ''){
		this.eventHandler(message);
		$(this.inputElement).val('');
	}
};

/**
 * Toolbar Listener
 */
window.toolbarListener = function(){
	this.colorElement = null;
	this.widthElement = null;
	this.colorEventHandler = null;
	this.widthEventHandler = null;
};

toolbarListener.prototype.init = function(colorElement, widthElement, colorEventHandler, widthEventHandler){
	this.colorElement = colorElement;
	this.widthElement = widthElement;
	this.colorEventHandler = colorEventHandler;
	this.widthEventHandler = widthEventHandler;
	$(this.colorElement).change(this.colorChangeEvent.bind(this));
	$(this.widthElement).change(this.widthChangeEvent.bind(this));
};

toolbarListener.prototype.colorChangeEvent = function(event){
	var newColor = $(this.colorElement).find('option:selected').val();
	this.colorEventHandler(newColor);
};

toolbarListener.prototype.widthChangeEvent = function(event){
	var newWidth = $(this.widthElement).find('option:selected').val();
	this.widthEventHandler(newWidth);
};

/**
 * Line Creator Module
 */
window.lineCreator = function(){
	this.line = null;
	this.clientPush = null;
	this.serverPush = null;
	this.getLineContext = null;
	this.sampler = new pointSampler();
};

lineCreator.prototype.init = function(modelNewLine, modelContinueLine, modelEndLine, client, server, getLineContext){
	this.modelNewLine = modelNewLine;
	this.modelContinueLine = modelContinueLine;
	this.modelEndLine = modelEndLine;
	this.clientPush = client;
	this.serverPush = server;
	this.getLineContext = getLineContext;
};

lineCreator.prototype.newLine = function(){
	this.line = new lineModel();
	this.line.setContext(this.getLineContext());
	this.modelNewLine(this.line.getContext());
};

lineCreator.prototype.continueLine = function(data, element){
	var point = this.relativeCoordinateGetter(data.pageX, data.pageY, element);
	this.sampler.setCurrentPoint(point);
	if(this.sampler.shouldSegment()) {
		console.log("Line segmented");
		// End the current line with this point
		this.line.addPoint(point);
		this.modelContinueLine(point);
		this.endLine(true);
		// Start a new line with this point
		this.newLine();
		this.line.addPoint(point);
		this.modelContinueLine(point);
		this.sampler.currentPointAdded();
	} else if(this.sampler.shouldAdd()) {
		console.log("Point added");
		this.line.addPoint(point);
		this.modelContinueLine(point);
		this.sampler.currentPointAdded();
	}
};

lineCreator.prototype.endLine = function(segment){
	if(!segment) {
		this.sampler.endSampling();
	}
	this.modelEndLine();
	this.serverPush(this.line);
	this.line = null;
};

lineCreator.prototype.relativeCoordinateGetter = function(pageX, pageY, element){
	var relx = (pageX - element.offsetLeft) * (element.width / element.offsetWidth);
	var rely = (pageY - element.offsetTop) * (element.height / element.offsetHeight);
	return {x: relx, y: rely};
};

function pointSampler() {
	this.lastPoint = null;
	this.currentPoint = null;
	this.sampleRate = 4;
	this.pointsSampled = 0;
	this.minDist = 10;
}
pointSampler.prototype.setCurrentPoint = function(point) {
	this.currentPoint = point;
}
pointSampler.prototype.shouldAdd = function() {
	if(this.lastPoint == null) {
		return true;
	} else if(this.currentPoint != null) {
		var dx = this.currentPoint.x - this.lastPoint.x;
		var dy = this.currentPoint.y - this.lastPoint.y;
		return Math.floor(Math.sqrt( dx*dx + dy*dy )) > this.minDist;
	}
	
	return false;
}	
pointSampler.prototype.shouldSegment = function() {
	if(this.pointsSampled === this.sampleRate) {
		return true;
	}
	return false;
}
pointSampler.prototype.endSampling = function() {
	this.lastPoint = null;
	this.currentPoint = null;
	this.pointsSampled = 0;
}
pointSampler.prototype.currentPointAdded = function() {
	this.lastPoint = this.currentPoint;
	this.pointsSampled++;
	if(this.pointsSampled > this.sampleRate) this.pointsSampled = 1;
}

/**
 * Server Listener Module
 */
window.serverListener = function(socket){
	this.socket = socket;
	this.lineHandler = null;
	this.messageHandler = null;
};

serverListener.prototype.init = function(line, message){
	this.lineHandler = line;
	this.messageHandler = message;
	this.lineCollectionSync();
	this.lineSync();
	this.messageSync();
};

serverListener.prototype.lineCollectionSync = function(){
	var sync = function(data){
		for (var i = 0; i < data.length; i++){
			// this.lineHandler({id: data[i].id, points: data[i].data, context: ???});
			this.lineHandler({id: data[i].id, points: data[i].data});
		}
	};
	this.socket.on("sync", sync.bind(this));
};

serverListener.prototype.lineSync = function(){
	var sync = function(data){
		// this.lineHandler({id: data.line.id, points: data.line.data, context: ???});
		this.lineHandler({id: data.line.id, points: data.line.data});
	}
	this.socket.on("draw", sync.bind(this));
};

serverListener.prototype.messageSync = function(){
	var sync = function(data){
		this.messageHandler(data.message);
	}
	this.socket.on("chat", sync.bind(this));
};

/**
 * Server Emitter Module
 */
window.serverEmitter = function(socket){
	this.socket = socket;
};

serverEmitter.prototype.newSession = function(id){
	this.socket.emit('new user', { whiteboardId: id });
};

serverEmitter.prototype.addLine = function(line){
	// this.socket.emit('draw', {line: {color: line.context, data: line.points}});
	this.socket.emit('draw', {'line': {'color': 'black', 'data': line.points}});
};

serverEmitter.prototype.addMessage = function(message){
	this.socket.emit('chat', {'message': message});
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

	this.serverIntervalTime = 100;
	this.clientIntervaltime = 100;
};

queueSyncManager.prototype.init = function(client, server){
	//
	this.clientSyncHandler = client;
	this.serverSyncHandler = server;
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.clientIntervalTime);
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.serverIntervalTime);

};

queueSyncManager.prototype.addClientQueue = function(data){
	this.clientQueue.push(data);
};

queueSyncManager.prototype.addServerQueue = function(data){
	console.log("Adding line to server queue");
	this.serverQueue.push(data);
};

queueSyncManager.prototype.clientQueueManager = function(){
	// clearInterval(this.clientQueueInterval);
	var that = this;
	while (this.clientQueue.length > 0){
		this.clientSyncHandler(this.clientQueue[0])
		this.clientQueue.shift();
	}
	// this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.serverIntervalTime);
};

queueSyncManager.prototype.serverQueueManager = function(){
	// clearInterval(this.serverQueueInterval);
	var that = this;
	console.log("Syncing ... server queue is " + this.serverQueue.length);
	while (this.serverQueue.length > 0){
		this.serverSyncHandler(this.serverQueue[0]);
		this.serverQueue.shift(); 
	}
	// this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.clientIntervalTime);
};

window.whiteboardController = function(){
	this.socket = null;
	this.whiteboardView = null;
	this.whiteboardModel = null;
	this.whiteboardServerEmitter = null;
	this.whiteboardQueueManager = null;
	this.whiteboardServerListener = null;
	this.whiteboardLineCreator = null;
	this.whiteboardListener = null;
	this.chatListener = null;
};

whiteboardController.prototype.init = function(canvas, chatForm, chatMessage, colorSelect, widthSelect, printMessages){
	this.socket = io.connect('localhost:3000');
	this.whiteboardView = new whiteboardView();
	this.whiteboardView.init(canvas);
	this.chatView = new chatView(printMessages);
	this.whiteboardModel = new whiteboardModel(this.whiteboardView.draw.bind(this.whiteboardView));
	this.toolbarModel = new toolbarModel();
	this.chatModel = new messagesModel(this.chatView.printMessage.bind(this.chatView));
	this.whiteboardServerEmitter = new serverEmitter(this.socket);
	this.whiteboardQueueManager = new queueSyncManager();
	this.whiteboardQueueManager.init(
		this.whiteboardModel.addLine.bind(this.whiteboardModel), 
		this.whiteboardServerEmitter.addLine.bind(this.whiteboardServerEmitter)
	);
	this.toolbarListener = new toolbarListener();
	this.toolbarListener.init(
		colorSelect, 
		widthSelect, 
		this.toolbarModel.setColor.bind(this.toolbarModel),
		this.toolbarModel.setWidth.bind(this.toolbarModel)
	);
	var chatHandler = function(message){
		this.whiteboardServerEmitter.addMessage(message);
		this.chatModel.addMessage('You: ' + message);
	};
	this.chatListener = new chatListener();
	this.chatListener.init(chatForm, chatMessage, chatHandler.bind(this));
	this.whiteboardServerListener = new serverListener(this.socket);
	this.whiteboardServerListener.init(
		this.whiteboardQueueManager.addClientQueue.bind(this.whiteboardQueueManager),
		this.chatModel.addMessage.bind(this.chatModel)
	);
	this.whiteboardLineCreator = new lineCreator();
	this.whiteboardLineCreator.init(
		this.whiteboardModel.newLine.bind(this.whiteboardModel),
		this.whiteboardModel.continueLine.bind(this.whiteboardModel),
		this.whiteboardModel.endLine.bind(this.whiteboardModel),
		this.whiteboardQueueManager.addClientQueue.bind(this.whiteboardQueueManager), 
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager),
		this.toolbarModel.getContext.bind(this.toolbarModel)
	);
	this.whiteboardListener = new whiteboardListener();
	this.whiteboardListener.init(
		canvas,
		this.whiteboardLineCreator.newLine.bind(this.whiteboardLineCreator),
		this.whiteboardLineCreator.continueLine.bind(this.whiteboardLineCreator),
		this.whiteboardLineCreator.endLine.bind(this.whiteboardLineCreator) 
	);
	this.whiteboardServerEmitter.newSession(document.location.pathname.split('whiteboard/')[1]);
};
});
