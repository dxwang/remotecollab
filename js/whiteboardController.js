$(document).ready(function(){

window.whiteboardController = {
	init: function(){
		whiteboardView.canvasObj.on("mousedown", whiteboardController.continueDraw);
	},
	/**
     * Resolves the relative width and height of the canvas
     * element. Relative parameters can vary depending on the
     * zoom. Both are equal to 1 if no zoom is encountered.
     * 
     * @return An array containing the relative width as first
     * element and relative height as second.
     */
    getRelative: function() {
	    return {width: whiteboardView.canvas.width/whiteboardView.canvas.offsetWidth,
			    height: whiteboardView.canvas.height/whiteboardView.canvas.offsetHeight};
    },

	/**
	 * Resolves the X coordinate of the given event inside
	 * the canvas element.
	 * 
	 * @param event The event that has been executed.
	 * @return The x coordinate of the event inside the 
	 * canvas element.
	 */
	getX: function(event) {
		var cssx = (event.pageX - whiteboardView.canvasObj.offset().left);
	    var xrel = whiteboardController.getRelative().width;
	    var canvasx = cssx * xrel;
	    return canvasx;
	},
	
	/**
	 * Resolves the Y coordinate of the given event inside
	 * the canvas element.
	 * 
	 * @param event The event that has been executed.
	 * @return The y coordinate of the event inside the 
	 * canvas element.
	 */
	getY: function(event) {
	    var cssy = (event.pageY - whiteboardView.canvasObj.offset().top);
	    var yrel = whiteboardController.getRelative().height;
	    var canvasy = cssy * yrel;
	    return canvasy;
	},

	continueDraw: function(event){
		whiteboardView.canvasObj.bind("mousemove", function(event){
			whiteboardModel.addPointToCurrentLine([whiteboardController.getX(event), whiteboardController.getY(event)]);
		});
		whiteboardView.canvasObj.bind("mouseup", whiteboardController.endDraw);
		whiteboardView.canvasObj.bind("mouseout", whiteboardController.endDraw);
	},

	endDraw: function(event){
		whiteboardView.canvasObj.unbind("mousemove");
		whiteboardView.canvasObj.unbind("mouseup");
		whiteboardView.canvasObj.unbind("mouseout");

		whiteboardModel.endCurrentLine();
	}
}


});