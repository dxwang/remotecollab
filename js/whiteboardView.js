$(document).ready(function(){

window.whiteboardView = function(){
	this.canvas = null;
	this.context = null;
	this.colorMap = {
		'black': '#000000',
		'red': '#ff0000',
		'green': '#00ff00',
		'blue': '#0000ff',
		'yellow': '#ffff00'
	};
};

whiteboardView.prototype.init = function(canvas) {
	this.canvas = canvas;
	this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

	this.context = canvas.getContext('2d');

	this.context.lineCap = 'round';
};

whiteboardView.prototype.draw = function(line, lineContext){
	if (lineContext !== null){
		this.context.lineWidth = lineContext.width || this.context.lineWidth;
		this.context.strokeStyle = lineContext.color || this.context.strokeStyle;
	}

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

whiteboardView.prototype.clear = function(){
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

window.chatView = function(chat){
	this.chat = chat;
};

chatView.prototype.printMessage = function(message){
	var newMessage = $('<li>').text(message);
	$(this.chat).append(newMessage);
};
});
