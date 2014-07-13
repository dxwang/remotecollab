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
};

whiteboardListener.prototype.activate = function(){
	$(this.element).bind("mousedown", this.mouseStart.bind(this));
};

whiteboardListener.prototype.deactivate = function(){
	$(this.element).unbind("mousedown");
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
	console.log("Mouse up detected");
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
	if (message){
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
	this.toolElement = null;
	this.colorEventHandler = null;
	this.widthEventHandler = null;
	this.toolEventHandler = null;
};

toolbarListener.prototype.init = function(colorElement, widthElement, toolElement, colorEventHandler, widthEventHandler, toolEventHandler){
	this.colorElement = colorElement;
	this.widthElement = widthElement;
	this.toolElement = toolElement;
	this.colorEventHandler = colorEventHandler;
	this.widthEventHandler = widthEventHandler;
	this.toolEventHandler = toolEventHandler;
	$(this.colorElement).change(this.colorChangeEvent.bind(this));
	$(this.widthElement).change(this.widthChangeEvent.bind(this));
	$(this.toolElement).change(this.toolChangeEvent.bind(this));
};

toolbarListener.prototype.colorChangeEvent = function(event){
	var newColor = $(this.colorElement).find('option:selected').val();
	this.colorEventHandler(newColor);
};

toolbarListener.prototype.widthChangeEvent = function(event){
	var newWidth = $(this.widthElement).find('option:selected').val();
	this.widthEventHandler(newWidth);
};

toolbarListener.prototype.toolChangeEvent = function(event){
	var newTool = $(this.toolElement).find('option:selected').val();
	this.toolEventHandler(newTool);
};

/**
 * Tool Selector Module
 */
window.toolSelector = function(){
	this.activeTool = null;
	this.toolMap = null;
};

toolSelector.prototype.init = function(toolMap){
	this.toolMap = toolMap;
	this.changeTool('pencil');
};

toolSelector.prototype.changeTool = function(newTool){
	if (this.activeTool){
		this.activeTool.deactivate();
	}
	this.activeTool = this.toolMap[newTool];
	if (this.activeTool){
		this.activeTool.activate();
	}
};

/**
 * Line Creator Module
 */
window.lineManager = function(){
	this.line = null;
	this.clientPush = null;
	this.serverPush = null;
	this.getLineContext = null;
	this.sampleRate = 1;
	this.pointSample = this.sampleRate;
};

lineManager.prototype.init = function(client, server, getLineContext){
	this.clientPush = client;
	this.serverPush = server;
	this.getLineContext = getLineContext;
};

lineManager.prototype.newLine = function(){
	this.line = new lineModel();
	this.line.setContext(this.getLineContext());
};

lineManager.prototype.setEraseStart = function(data, element){
	this.eraseStart = this.relativeCoordinateGetter(data.pageX, data.pageY, element);
}

lineManager.prototype.continueLine = function(data, element){
	this.line.addPoint(this.relativeCoordinateGetter(data.pageX, data.pageY, element));
	this.pointSampler(this.line, false);
};

lineManager.prototype.endLine = function(){
	this.pointSampler(this.line, true);
	this.line = null;
	this.pointSample = this.sampleRate;
};

lineManager.prototype.setEraseEnd = function(data, element){
	this.eraseEnd = this.relativeCoordinateGetter(data.pageX, data.pageY, element);
}

lineManager.prototype.relativeCoordinateGetter = function(pageX, pageY, element){
	var relx = (pageX - element.offsetLeft) * (element.width / element.offsetWidth);
	var rely = (pageY - element.offsetTop) * (element.height / element.offsetHeight);
	return {x: relx, y: rely};
};

lineManager.prototype.pointSampler = function(line, noSample){
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
			this.lineHandler({id: data[i].id, points: data[i].data, context: {color: data[i].color, width: '1'}});
		}
	};
	this.socket.on("sync", sync.bind(this));
};

serverListener.prototype.lineSync = function(){
	var sync = function(data){
		this.lineHandler({id: data.line.id, points: data.line.data, context: {color: data.line.color, width: '1'}});
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
	this.socket.emit('draw', {line: {color: line.context.color, data: line.points}});
};

serverEmitter.prototype.addMessage = function(message){
	this.socket.emit('chat', {'message': message});
};

/**
 * Queue Sync Manager
 */
window.queueSyncManager = function(){
	this.clientSyncHandler = null;
	this.serverSyncHandler = null;
	this.cientEraseHandler = null;
	this.serverEraseHandler = null;
	this.clientQueue = [];
	this.serverQueue = [];
	this.clientQueueInterval = null;
	this.serverQueueInterval = null;

	this.serverIntervalTime = 100;
	this.clientIntervaltime = 1;
};

queueSyncManager.prototype.init = function(clientCreate, serverCreate, clientErase, serverErase){
	this.clientSyncHandler = clientCreate;
	this.serverSyncHandler = serverCreate;
	this.clientEraseHandler = clientErase;
	this.serverEraseHandler = serverErase;
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.serverIntervalTime);
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.clientIntervalTime);

};

queueSyncManager.prototype.addClientQueue = function(data){
	this.clientQueue.push({'type': 'add', 'data': data});
};

queueSyncManager.prototype.addServerQueue = function(data){
	this.serverQueue.push({'type': 'add', 'data': data});
};

queueSyncManager.prototype.removeClientQueue = function(data){
	this.clientQueue.push({'type': 'remove', 'data': data});
};

queueSyncManager.prototype.removeServerQueue = function(data){
	this.serverQueue.push({'type': 'remove', 'data': data});
};

queueSyncManager.prototype.clientQueueManager = function(){
	clearInterval(this.clientQueueInterval);
	var that = this;
	while (this.clientQueue.length > 0){
		if (this.clientQueue[0].type === 'remove'){
			this.serverEraseHandler(this.clientQueue[0].data);
		} else {
			this.serverSyncHandler(this.clientQueue[0].data);
		}
		this.clientQueue.shift();
	}
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.serverIntervalTime);
};

queueSyncManager.prototype.serverQueueManager = function(){
	clearInterval(this.serverQueueInterval);
	var that = this;
	while (this.serverQueue.length > 0){
		if (this.serverQueue[0].type === 'remove'){
			this.clientEraseHandler(this.serverQueue[0].data);
		} else {
			this.clientSyncHandler(this.serverQueue[0].data);
		}
		this.serverQueue.shift();
	}
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.clientIntervalTime);
};

window.whiteboardController = function(){
	this.socket = null;
	this.whiteboardView = null;
	this.whiteboardModel = null;
	this.whiteboardServerEmitter = null;
	this.whiteboardQueueManager = null;
	this.whiteboardServerListener = null;
	this.whiteboardLineManager = null;
	this.whiteboardListener = null;
	this.chatListener = null;
};

whiteboardController.prototype.init = function(canvas, chatForm, chatMessage, colorSelect, widthSelect, toolSelect, printMessages){
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
	var chatHandler = function(message){
		this.whiteboardServerEmitter.addMessage(message);
		this.chatModel.addMessage('You: ' + message);
	};
	this.chatListener = new chatListener();
	this.chatListener.init(chatForm, chatMessage, chatHandler.bind(this));
	this.whiteboardServerListener = new serverListener(this.socket);
	this.whiteboardServerListener.init(
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager),
		this.chatModel.addMessage.bind(this.chatModel)
	);
	this.whiteboardLineManager = new lineManager();
	this.whiteboardLineManager.init(
		this.whiteboardQueueManager.addClientQueue.bind(this.whiteboardQueueManager), 
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager),
		this.toolbarModel.getContext.bind(this.toolbarModel)
	);
	this.drawListener = new whiteboardListener();
	this.drawListener.init(
		canvas,
		this.whiteboardLineManager.newLine.bind(this.whiteboardLineManager),
		this.whiteboardLineManager.continueLine.bind(this.whiteboardLineManager),
		this.whiteboardLineManager.endLine.bind(this.whiteboardLineManager) 
	);
	// this.eraseListener = new whiteboardListener();
	this.toolSelector = new toolSelector();
	this.toolSelector.init({
		'pencil': this.drawListener
	});
	this.toolbarListener = new toolbarListener();
	this.toolbarListener.init(
		colorSelect, 
		widthSelect, 
		toolSelect,
		this.toolbarModel.setColor.bind(this.toolbarModel),
		this.toolbarModel.setWidth.bind(this.toolbarModel),
		this.toolSelector.changeTool.bind(this.toolSelector)
	);
	this.whiteboardServerEmitter.newSession(document.location.pathname.split('whiteboard/')[1]);
};
});
