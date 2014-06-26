var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

// MongoDB Schemas
var Schema = mongoose.Schema;
var pointSchema = new Schema({x:Number, y:Number});
var lineSchema = new Schema({id: Number, colour: String, line:[pointSchema]});
var boardSchema = new Schema({
	_id: Number,
	url: String,
	data: [lineSchema] 

});

// Compile the schemas into models
var Point = mongoose.model('Point', pointSchema);
var Line = mongoose.model('Line', lineSchema);
var Board = mongoose.model('Board', boardSchema);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
	console.log("db open");
});

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    // When the server receives a chat msg, emit it to all clients
    io.emit('chat message', msg);
    readDB();
    //insertLine();
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


var readDB = function() {
  Board.findOne(function (err, board) {
    if (err) return;
    console.log(board.url);
  });
};

//TODO: Implement this properly
// This function should add the line [(0,0), (100,100)] to board with id:1
// and save this to the database. Repeated calls to this function should insert new lines to the same board
var insertLine = function() {                                                                                      
  //insert the line 0,0 100,100                                                                                    
 var point = new Point( {x:0, y:0});                                                                               
 var point2 = new Point( {x:100, y:100});                                                                          
 var line = new Line( {id:3, colour:"black", line:[point, point2]});                                               
 var b = new Board( {_id:2, url:"jokes", data: line});                                                             
 b.save(function (err, board) {                                                                                    
        console.log( board);                                                                                       
 });
};