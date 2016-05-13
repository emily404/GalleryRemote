var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));
var screens = {};

io.on('connection', function(socket){
  console.log('a user connected ' + socket.id);

  socket.emit('id', socket.id);

  socket.on('remote connected', function(){
    io.emit('current screens', Object.keys(screens));
    console.log("emitting " + Object.keys(screens));
  });

  socket.on('screen associate', function(socketid, screenname){
    screens[screenname] = socketid;
    console.log(screens);
  });

  socket.on('screen connected', function(screenname){
    io.emit('screen connected', screenname);
    console.log('screen ' + screenname + ' connected');
  });

  socket.on('join', function(roomname, screen) {
    var screen_socket = io.sockets.connected[screens[screen]];
    screen_socket.join(roomname);
    console.log('joining ' + roomname + ' and ' + screen);
  });

  socket.on('image selection in room', function(roomname, index){
  	io.to(roomname).emit('image selection', index);
  	console.log('index: ' + index);
  });

  socket.on('disconnect', function(){
    io.emit('disconnect', socket.id);
    console.log('user disconnected');
  });
});

http.listen(8080, function(){
    console.log('listening on *:8080');
});
