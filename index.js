var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var imageCount = 7;

app.use(express.static('public'));
var screens = {};

function refreshScreens(roomname, index) {
    // multi screen
    var socket_list = io.sockets.adapter.rooms[roomname];
    if (socket_list)
        for (var s in socket_list.sockets) {
          io.sockets.connected[s].emit('image selection', index);
          index = (index + 1) % imageCount;
        }
}

io.on('connection', function(socket){
  console.log('a user connected ' + socket.id);

  socket.emit('id', socket.id);

  socket.on('remote connected', function(){
    socket.emit('current screens', Object.keys(screens));
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

  socket.on('join', function(roomname, screen, index) {
    var screen_socket = io.sockets.connected[screens[screen]];
    screen_socket.join(roomname);
    console.log('joining ' + roomname + ' and ' + screen);
    // io.to(screens[screen]).emit('image selection', index);
    refreshScreens(roomname, index);
  });

  socket.on('leave', function(roomname, screen, index) {
    var screen_socket = io.sockets.connected[screens[screen]];
    screen_socket.leave(roomname);
    console.log(screen + ' is leaving ' + roomname);
    io.to(screens[screen]).emit('image clear');
    refreshScreens(roomname, index);
  });

  socket.on('image selection in room', function(roomname, index){
    refreshScreens(roomname, index);
  });

  socket.on('disconnect', function(){
    io.emit('disconnect', socket.id);
    console.log('user disconnected');
    var screen;
    for (var key in screens) {
        if (screens[key] == socket.id) {
            screen = key;
            io.emit('screen disconnected', key);
            break;
        }
    }
    if (screen) {
        delete screens[screen];
        console.log(screens);
    } else {
        io.to(socket.id+"web").emit('image clear');
    }
  });

});

http.listen(8080, function(){
    console.log('listening on *:8080');
});
