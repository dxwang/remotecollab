var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    var kittySchema = mongoose.Schema({
	name: String
    })
    kittySchema.methods.speak = function() {
	var greeting = this.name
	? "Meow name is " + this.name
	: "I don't have a name"
   	console.log(greeting);
    }

    var Kitten = mongoose.model('Kitten', kittySchema)
    var silence = new Kitten({ name: 'Silence' })
    console.log(silence.name)
    var fluffy = new Kitten({ name: 'fluffy' });
    fluffy.speak()
    fluffy.save(function (err, fluffy) { 
	if (err) return console.error(err);
	fluffy.speak();
    });

    Kitten.find(function (err, kittens) { 
	if (err) return console.error(err);
	console.log(kittens)
    })
});

var insertLine = function() {
  //insert the line 0,0 100,100
  
};

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    // When the server receives a chat msg, emit it to all clients
    io.emit('chat message', msg);
    insertLine();
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
