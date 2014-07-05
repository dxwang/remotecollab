var config = require('./js/config/config.js');
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

http.listen(3000, function(){
  console.log('listening on *:3000');
});

};
