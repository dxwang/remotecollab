$(document).ready(function(){

window.whiteboardView = function(){
	this.canvas = null;
	this.context = null;
};

whiteboardView.prototype.init = function(canvas) {
	this.canvas = canvas;
	this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

	this.context = canvas.getContext('2d');

	this.context.lineWidth = 1;
	this.context.lineCap = 'round';
};

whiteboardView.prototype.draw = function(line){
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
};
});