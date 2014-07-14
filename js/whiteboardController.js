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
	// this.line = null;
	this.getUserId = null;
	this.modelNewLine = null;
	this.modelContinueLine = null;
	this.modelEndLine = null;
	this.modelEraseLines = null;
	this.modelGetCurrentLine = null;
	this.serverAdd = null;
	this.serverRemove = null;
	this.getLineContext = null;

	this.sampler = new pointSampler();
};

lineManager.prototype.init = function(getUserId, modelNewLine, modelContinueLine, modelEndLine, modelEraseLines, modelGetCurrentLine, serverAdd, serverRemove, getLineContext){
	this.getUserId = getUserId;
	this.modelNewLine = modelNewLine;
	this.modelContinueLine = modelContinueLine;
	this.modelEndLine = modelEndLine;
	this.modelEraseLines = modelEraseLines;
	this.modelGetCurrentLine = modelGetCurrentLine;
	this.serverAdd = serverAdd;
	this.serverRemove = serverRemove;
	this.getLineContext = getLineContext;
};

lineManager.prototype.newLine = function(){
	// this.line = new lineModel(this.userId());
	// this.line.setContext(this.getLineContext());
	this.modelNewLine(this.getLineContext(), this.getUserId());
};

lineManager.prototype.continueLine = function(data, element){
	var point = this.relativeCoordinateGetter(data.pageX, data.pageY, element);
	this.sampler.setCurrentPoint(point);
	if(this.sampler.shouldSegment()) {
		// End the current line with this point
		// this.line.addPoint(point);
		this.modelContinueLine(point);
		this.endLine(true);
		// Start a new line with this point
		this.newLine();
		// this.line.addPoint(point);
		this.modelContinueLine(point);
		this.sampler.currentPointAdded();
	} else if (this.sampler.shouldAdd()) {
		// this.line.addPoint(point);
		this.modelContinueLine(point);
		this.sampler.currentPointAdded();
	}
};

lineManager.prototype.endLine = function(segment){
	if (!segment){
		this.sampler.endSampling();
	}
	this.serverAdd(this.modelGetCurrentLine());
	this.modelEndLine();
	// this.line = null;
};

lineManager.prototype.eraseLineAtPoint = function(data, element){
	this.erasePoint = this.relativeCoordinateGetter(data.pageX, data.pageY, element);
	var upBound = Math.max(this.erasePoint.y - 10, 0);
	var downBound = Math.min(this.erasePoint.y + 10, 1000);
	var leftBound = Math.max(this.erasePoint.x - 10, 0);
	var rightBound = Math.min(this.erasePoint.x + 10, 1000);

	var erasePoints = this.modelEraseLines(upBound, downBound, leftBound, rightBound);
	for (var i=0;i<erasePoints.length;i++){
		this.serverRemove(erasePoints[i]);
	}

	this.eraseStart = null;
	this.eraseEnd = null;
};

lineManager.prototype.relativeCoordinateGetter = function(pageX, pageY, element){
	var relx = (pageX - element.offsetLeft) * (element.width / element.offsetWidth);
	var rely = (pageY - element.offsetTop) * (element.height / element.offsetHeight);
	return {x: relx, y: rely};
};

window.pointSampler = function() {
	this.lastPoint = null;
	this.currentPoint = null;
	this.sampleRate = 4;
	this.pointsSampled = 0;
	this.minDist = 10;
};

pointSampler.prototype.setCurrentPoint = function(point) {
	this.currentPoint = point;
};

pointSampler.prototype.shouldAdd = function() {
	if(this.lastPoint == null) {
		return true;
	} else if(this.currentPoint != null) {
		var dx = this.currentPoint.x - this.lastPoint.x;
		var dy = this.currentPoint.y - this.lastPoint.y;
		return Math.floor(Math.sqrt( dx*dx + dy*dy )) > this.minDist;
	}
	
	return false;
};

pointSampler.prototype.shouldSegment = function() {
	if(this.pointsSampled === this.sampleRate) {
		return true;
	}
	return false;
};

pointSampler.prototype.endSampling = function() {
	this.lastPoint = null;
	this.currentPoint = null;
	this.pointsSampled = 0;
};

pointSampler.prototype.currentPointAdded = function() {
	this.lastPoint = this.currentPoint;
	this.pointsSampled++;
	if(this.pointsSampled > this.sampleRate) this.pointsSampled = 1;
};

/**
 * Server Listener Module
 */
window.serverListener = function(socket){
	this.socket = socket;
	this.lineAddHandler = null;
	this.lineRemoveHandler = null;
	this.messageHandler = null;
};

serverListener.prototype.init = function(user, lineAdd, lineRemove, message){
	this.setUser = user;
	this.lineAddHandler = lineAdd;
	this.lineRemoveHandler = lineRemove;
	this.messageHandler = message;
	this.joined();
	this.lineCollectionSync();
	this.lineSync();
	this.messageSync();
};

serverListener.prototype.joined = function(){
	var sync = function(data){
		this.setUser(data.yourUserId);
	};
	this.socket.on("you joined", sync.bind(this));
}

serverListener.prototype.lineCollectionSync = function(){
	var sync = function(data){
		for (var i = 0; i < data.length; i++){
			this.lineAddHandler({'id': data[i].id, 'points': data[i].data, 'context': {'color': data[i].color, 'width': data[i].width}});
		}
	};
	this.socket.on("sync", sync.bind(this));
};

serverListener.prototype.lineSync = function(){
	var sync = function(data){
		this.lineAddHandler({'id': data.line.id, 'points': data.line.data, 'context': {'color': data.line.color, 'width': data.line.width}});
	}
	this.socket.on("draw", sync.bind(this));
};

serverListener.prototype.messageSync = function(){
	var sync = function(data){
		this.messageHandler(data.message);
	}
	this.socket.on("chat", sync.bind(this));
};

serverListener.prototype.lineRemove = function(){
	var remove = function(data){
		this.lineRemoveHandler(data.id);
	}
	this.socket.on("erase", remove.bind(this));
}

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
	this.socket.emit('draw', {'line': {'id': line.id, 'color': line.context.color, 'width': line.context.width, 'data': line.points}});
};

serverEmitter.prototype.addMessage = function(message){
	this.socket.emit('chat', {'message': message});
};

serverEmitter.prototype.removeLine = function(id){
	console.log(id);
	this.socket.emit('erase', {'id': id});
}

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
	this.clientIntervaltime = 100;
};

queueSyncManager.prototype.init = function(clientCreate, serverCreate, clientErase, serverErase){
	this.clientSyncHandler = clientCreate;
	this.serverSyncHandler = serverCreate;
	this.clientEraseHandler = clientErase;
	this.serverEraseHandler = serverErase;
	this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.serverIntervalTime);
	this.serverQueueInterval = setInterval(this.serverQueueManager.bind(this), this.clientIntervalTime);
};

// Client calls this to add command.
queueSyncManager.prototype.addClientQueue = function(data){
	this.clientQueue.push({'type': 'add', 'data': data});
};

// Server calls this to add command.
queueSyncManager.prototype.addServerQueue = function(data){
	this.serverQueue.push({'type': 'add', 'data': data});
};

// Client calls this to remove command.
queueSyncManager.prototype.removeClientQueue = function(data){
	this.clientQueue.push({'type': 'remove', 'data': data});
};

// Server calls this to remove command.
queueSyncManager.prototype.removeServerQueue = function(data){
	this.serverQueue.push({'type': 'remove', 'data': data});
};

// Takes commands from the client and syncs them to the server.
queueSyncManager.prototype.clientQueueManager = function(){
	// clearInterval(this.clientQueueInterval);
	var that = this;
	while (this.clientQueue.length > 0){
		if (this.clientQueue[0].type === 'remove'){
			this.serverEraseHandler(this.clientQueue[0].data);
		} else {
			this.serverSyncHandler(this.clientQueue[0].data);
		}
		this.clientQueue.shift();
	}
	// this.clientQueueInterval = setInterval(this.clientQueueManager.bind(this), this.serverIntervalTime);
};

// Takes commands from the server and syncs them to the client.
queueSyncManager.prototype.serverQueueManager = function(){
	// clearInterval(this.serverQueueInterval);
	var that = this;
	while (this.serverQueue.length > 0){
		if (this.serverQueue[0].type === 'remove'){
			this.clientEraseHandler(this.serverQueue[0].data);
		} else {
			this.clientSyncHandler(this.serverQueue[0].data);
		}
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
	this.whiteboardLineManager = null;
	this.whiteboardListener = null;
	this.chatListener = null;
};

whiteboardController.prototype.init = function(canvas, chatForm, chatMessage, colorSelect, widthSelect, toolSelect, printMessages){
	this.socket = io.connect('localhost:3000');
	this.userId = null;
	this.setUserId = function(userId){
		console.log(userId);
		this.userId = userId;
	};
	this.getUserId = function(){
		return this.userId;
	};

	this.whiteboardView = new whiteboardView();
	this.whiteboardView.init(canvas);
	this.chatView = new chatView(printMessages);

	this.whiteboardModel = new whiteboardModel(
		this.whiteboardView.draw.bind(this.whiteboardView),
		this.whiteboardView.clear.bind(this.whiteboardView));
	this.toolbarModel = new toolbarModel();
	this.chatModel = new messagesModel(this.chatView.printMessage.bind(this.chatView));

	this.whiteboardServerEmitter = new serverEmitter(this.socket);

	this.whiteboardQueueManager = new queueSyncManager();
	this.whiteboardQueueManager.init(
		this.whiteboardModel.addLine.bind(this.whiteboardModel), 
		this.whiteboardServerEmitter.addLine.bind(this.whiteboardServerEmitter),
		this.whiteboardModel.removeLine.bind(this.whiteboardModel),
		this.whiteboardServerEmitter.removeLine.bind(this.whiteboardServerEmitter)
	);

	var chatHandler = function(message){
		this.whiteboardServerEmitter.addMessage(message);
		this.chatModel.addMessage('You: ' + message);
	};
	this.chatListener = new chatListener();
	this.chatListener.init(chatForm, chatMessage, chatHandler.bind(this));

	this.whiteboardServerListener = new serverListener(this.socket);
	this.whiteboardServerListener.init(
		this.setUserId.bind(this),
		this.whiteboardQueueManager.addServerQueue.bind(this.whiteboardQueueManager),
		this.whiteboardQueueManager.removeServerQueue.bind(this.whiteboardQueueManager),
		this.chatModel.addMessage.bind(this.chatModel)
	);

	this.whiteboardLineManager = new lineManager();
	this.whiteboardLineManager.init(
		this.getUserId.bind(this),
		this.whiteboardModel.newLine.bind(this.whiteboardModel),
		this.whiteboardModel.continueLine.bind(this.whiteboardModel),
		this.whiteboardModel.endLine.bind(this.whiteboardModel),
		this.whiteboardModel.removeLinesInBounds.bind(this.whiteboardModel),
		this.whiteboardModel.getCurrentLine.bind(this.whiteboardModel),
		this.whiteboardQueueManager.addClientQueue.bind(this.whiteboardQueueManager),
		this.whiteboardQueueManager.removeClientQueue.bind(this.whiteboardQueueManager),
		this.toolbarModel.getContext.bind(this.toolbarModel)
	);

	this.drawListener = new whiteboardListener();
	this.drawListener.init(
		canvas,
		this.whiteboardLineManager.newLine.bind(this.whiteboardLineManager),
		this.whiteboardLineManager.continueLine.bind(this.whiteboardLineManager),
		this.whiteboardLineManager.endLine.bind(this.whiteboardLineManager) 
	);

	this.eraseListener = new whiteboardListener();
	this.eraseListener.init(
		canvas,
		function(){},
		this.whiteboardLineManager.eraseLineAtPoint.bind(this.whiteboardLineManager),
		function(){}
	);

	this.toolSelector = new toolSelector();
	this.toolSelector.init({
		'pencil': this.drawListener,
		'eraser': this.eraseListener
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
