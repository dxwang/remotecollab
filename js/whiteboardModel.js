(function(){

window.whiteboardModel = {
	currentLine: [],
	currentLineId: null,
	lines: null,
	whiteboardId: null,

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
		// API call to get lines and possibly whiteboardId
		if (this.whiteboardId === null){
			whiteboardModel.mockGetNewWhiteboardId();
		}
		whiteboardModel.mockGetLines();
	},

	updateLine: function(id, line){
		lines[id] = line;
		whiteboardView.draw(line);
	},

	addPointToCurrentLine: function(coordinates){
		if (this.currentLineId === null){
			// API Call to get an Id for the current line
			whiteboardModel.mockGetNewLineId();
		}
		this.currentLine.push(coordinates);
		whiteboardModel.updateLine(this.currentLineId, this.currentLine);
		// API call to submit line, with line id
		whiteboardModel.mockAddLine(this.currentLineId, this.currentLine);
	},

	endCurrentLine: function(){
		this.currentLine = [];
		this.currentLineId = null;
	}
};

})();