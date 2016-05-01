var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', function(socket){
  console.log('a user connected ' + socket.id);

  socket.on('image selection', function(index){
  	io.emit('image selection', index);
  	console.log('index: ' + index);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(8080, function(){
    console.log('listening on *:8080');
});
