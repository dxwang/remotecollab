(function(){

window.whiteboardModel = {
	currentLine: [],
	currentLineId: null,
	lines: null,
	whiteboardId: null,
	userId: null,
	socket: null,

	/*
	Mock API Calls
	*/
	mockGetLines: function(){
		lines = {};
		for (var id in lines){
			whiteboardModel.updateLine(id, lines[id]);
		}
	},

	mockGetNewLineId: function(){
		this.currentLineId = Date.now();
	},

	mockGetNewWhiteboardId: function(){
		this.whiteboardId = Date.now();
	},

	mockAddLine: function(id, line){

	},
	/*
	End of API Calls
	*/

	init: function(){
		// Logic to get whiteboard Id from URL
		this.whiteboardId = 1;
		this.socket = io.connect('localhost:3000');
		this.socket.emit('new user', { whiteboardId: this.whiteboardId});
		this.socketListeners();
	},

	socketListeners: function(){
		this.socket.on('you joined', function(data){
			this.whiteboardId = data.whiteboardId;
		});

		this.socket.on('sync', function(data){
			for (var i=0;i<data.length;i++){
				var line = data[i];
				whiteboardModel.updateLine(line.id, line.data);
			}
		});

		this.socket.on('draw', function(data){
			updateLine(data.line.id, data.line.data);
		});

		this.socket.on('line added', function(data){
			this.currentLineId = data.id;
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

		this.socket.emit('draw', {line: {color: 'black'}, data: this.currentLine});
		// whiteboardModel.updateLine(this.currentLineId, this.currentLine);
		// API call to submit line, with line id
		// whiteboardModel.mockAddLine(this.currentLineId, this.currentLine);
	},

	endCurrentLine: function(){
		this.currentLine = [];
		this.currentLineId = null;
	}
};

})();