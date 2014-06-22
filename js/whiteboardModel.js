(function(){

window.whiteboardModel = {
	currentLine: [],
	lines: null,
	whiteboardId: null,

	/*
	Mock API Calls
	*/
	mockGetLines: function(){
		return {};
	},

	mockAddLine: function(line){
		this.lines[Date.now()] = line;
	},
	/*
	End of API Calls
	*/

	init: function(){
		// API call to get lines and whiteboardId
		this.lines = whiteboardModel.mockGetLines();


		for (var key in this.lines){
			whiteboardView.draw(lines[key]);
		}
	},

	updateLines: function(id, line){
		lines[id] = line;
		whiteboardView.draw(line);
	},

	addPointToCurrentLine: function(coordinates){
		this.currentLine.push(coordinates);
		whiteboardView.draw(this.currentLine);
	},

	endCurrentLine: function(){
		// API call to submit line, get line id, and add line to lines dict
		whiteboardModel.mockAddLine(this.currentLine);

		currentLine = [];
	}
};

})();