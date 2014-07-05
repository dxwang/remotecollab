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
		this.whiteboardId = 1;
		this.socket = io.connect('localhost:3000');
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

});