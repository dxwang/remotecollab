(function(){

window.whiteboardView = {
	canvas: null,
	canvasObj: null,
	context: null,

	init: function(canvas){
		console.log(canvas);
		this.canvas = canvas;
		this.canvasObj = $(canvas);
		this.context = canvas.getContext('2d');

		this.context.lineWidth = 1;
		this.context.lineCap = 'round';

		whiteboardModel.init();
		whiteboardController.init(canvas);

	},

	draw: function(line){
		console.log(line)
		if (line !== null){
			this.context.beginPath();
			this.context.stroke();
			this.context.moveTo(line[0][0], line[0][1]);
			for (var i=1;i<line.length;i++){
				this.context.lineTo(line[i][0], line[i][1]);
				this.context.stroke();
			}
			this.context.closePath();
		}
	}
}

})();