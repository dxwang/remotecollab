var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var insertLine = function() {
    console.log("Vithushan");
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
