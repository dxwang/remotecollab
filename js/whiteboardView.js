$(document).ready(function(){

window.whiteboardView = {
	canvas: null,
	canvasObj: null,
	context: null,

	init: function(canvas){

		this.canvas = canvas;
		this.canvas.width = this.canvas.offsetWidth;
	    this.canvas.height = this.canvas.offsetHeight;
	    this.canvasObj = $(canvas);

		this.context = canvas.getContext('2d');

		this.context.lineWidth = 1;
		this.context.lineCap = 'round';

		whiteboardModel.init();
		whiteboardController.init(canvas);
	},

	draw: function(line){
		if (line !== null && line.length > 0){
			this.context.beginPath();
			this.context.stroke();
			this.context.moveTo(line[0].x, line[0].y);
			for (var i=1;i<line.length;i++){
				this.context.lineTo(line[i].x, line[i].y);
				this.context.stroke();
			}
			this.context.closePath();
		}
	}
}

});