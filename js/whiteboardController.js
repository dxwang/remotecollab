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
 * Line Creator Module
 */
window.lineCreator = function(){
	this.line = null;
	this.clientPush = null;
	this.serverPush = null;
	this.sampleRate = 1;
	this.pointSample = this.sampleRate;
};

lineCreator.prototype.init = function(client, server){
	this.clientPush = client;
	this.serverPush = server;
};

lineCreator.prototype.newLine = function(){
	this.line = new lineModel();
	// this.line.setContext(this.getLineContext());
};

lineCreator.prototype.continueLine = function(data, element){
	this.line.addPoint(this.relativeCoordinateGetter(data.pageX, data.pageY, element));
	this.pointSampler(this.line, false);
};

lineCreator.prototype.endLine = function(){
	this.pointSampler(this.line, true);
	this.line = null;
	this.pointSample = this.sampleRate;
};

lineCreator.prototype.relativeCoordinateGetter = function(pageX, pageY, element){
	var relx = (pageX - element.offsetLeft) * (element.width / element.offsetWidth);
	var rely = (pageY - element.offsetTop) * (element.height / element.offsetHeight);
	return {x: relx, y: rely};
};

lineCreator.prototype.pointSampler = function(line, noSample){
	if (noSample || this.pointSample === 0){
		this.clientPush(line);
		this.serverPush(line);
		this.pointSample = this.sampleRate;
	} else {
		this.pointSample--;
	}
};

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

	this.intervalTime = 1;
};

queueSyncManager.prototype.init = function(client, server){
	this.clientSyncHandler = client;
	this.serverSyncHandler = server;
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.intervalTime);
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.intervalTime);

};

queueSyncManager.prototype.addClientQueue = function(data){
	this.clientQueue.push(data);
};

queueSyncManager.prototype.addServerQueue = function(data){
	this.serverQueue.push(data);
};

queueSyncManager.prototype.clientQueueManager = function(){
	clearInterval(this.clientQueueInterval);
	var that = this;
	while (this.clientQueue.length > 0){
		this.serverSyncHandler(this.clientQueue[0])
		this.clientQueue.shift();
	}
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.intervalTime);
};

queueSyncManager.prototype.serverQueueManager = function(){
	clearInterval(this.serverQueueInterval);
	var that = this;
	while (this.serverQueue.length > 0){
		this.clientSyncHandler(this.serverQueue[0]);
		this.serverQueue.shift(); 
	}
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.intervalTime);
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

whiteboardController.prototype.init = function(canvas, chatForm, chatMessage, printMessages){
	this.socket = io.connect('localhost:3000');
	this.whiteboardView = new whiteboardView();
	this.whiteboardView.init(canvas);
	this.chatView = new chatView(printMessages);
	this.whiteboardModel = new whiteboardModel(this.whiteboardView.draw.bind(this.whiteboardView));
	this.chatModel = new messagesModel(this.chatView.printMessage.bind(this.chatView));
	this.whiteboardServerEmitter = new serverEmitter(this.socket);
	this.whiteboardQueueManager = new queueSyncManager();
	this.whiteboardQueueManager.init(
		this.whiteboardModel.addLine.bind(this.whiteboardModel), 
		this.whiteboardServerEmitter.addLine.bind(this.whiteboardServerEmitter)
	);
	this.whiteboardServerListener = new serverListener(this.socket);
	this.whiteboardServerListener.init(
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager),
		this.chatModel.addMessage.bind(this.chatModel)
	);
	this.whiteboardLineCreator = new lineCreator();
	this.whiteboardLineCreator.init(
		this.whiteboardQueueManager.addClientQueue.bind(this.whiteboardQueueManager), 
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager)
	);
	this.whiteboardListener = new whiteboardListener();
	this.whiteboardListener.init(
		canvas,
		this.whiteboardLineCreator.newLine.bind(this.whiteboardLineCreator),
		this.whiteboardLineCreator.continueLine.bind(this.whiteboardLineCreator),
		this.whiteboardLineCreator.endLine.bind(this.whiteboardLineCreator) 
	);
	var chatHandler = function(message){
		this.whiteboardServerEmitter.addMessage(message);
		this.chatModel.addMessage('You: ' + message);
	};
	this.chatListener = new chatListener();
	this.chatListener.init(chatForm, chatMessage, chatHandler.bind(this));
	this.whiteboardServerEmitter.newSession(document.location.pathname.split('whiteboard/')[1]);
};
});
