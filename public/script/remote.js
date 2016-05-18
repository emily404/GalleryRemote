var currentImage = 0; // the currently selected image
var imageCount = 7; // the maximum number of images available
var remotesocket;
var screens;
var roomname;
var gammaOld = 0;
var gammaCurrent = 0;

function showImage (index){
    // Update selection on remote
    currentImage = index;
    var images = document.querySelectorAll("img");
    document.querySelector("img.selected").classList.toggle("selected");
    images[index].classList.toggle("selected");

    // Send the command to the screen
    remotesocket.emit('image selection in room', roomname, index);
}

function initialiseGallery(){
    var container = document.querySelector('#gallery');
    var i, img;
    for (i = 0; i < imageCount; i++) {
        img = document.createElement("img");
        img.src = "images/" +i +".jpg";
        document.body.appendChild(img);
        var handler = (function(index) {
            return function() {
                showImage(index);
            }
        })(i);
        img.addEventListener("click",handler);
    }

    document.querySelector("img").classList.toggle('selected');
}

document.addEventListener("DOMContentLoaded", function(event) {
    initialiseGallery();

    document.querySelector('#toggleMenu').addEventListener("click", function(event){
        var style = document.querySelector('#menu').style;
        style.display = style.display == "none" || style.display == ""  ? "block" : "none";
    });

    connectToServer();

    $(document).on('change' , "input[type='checkbox']" , function(){
        if (this.checked) {
            remotesocket.emit('join', roomname, this.value, currentImage);
        } else {
            remotesocket.emit('leave', roomname, this.value, currentImage);
        }
    });

    jerkTiltLR();

});

function connectToServer(){
    remotesocket = io();
    screens = [];

    remotesocket.on('screen connected', function(screenname){
        if (!screens.includes(screenname)) {
            screens.push(screenname);
            $('#menu table > tbody:last-child').append('<tr id='+screenname+'><td>'+screenname+'</td><td><input type="checkbox" name="screens" value=' + screenname + '></td></tr>');
            console.log(screenname);
        }
    });

    remotesocket.on('id', function(socketid){
        roomname = socketid + "web";
        console.log("current socket id = " + socketid);
    });

    remotesocket.on('connect', function(){
        remotesocket.emit('remote connected');
        console.log("remote connected");
    });

    remotesocket.on('current screens', function(currentscreens){
        screens = currentscreens;
        screens.forEach(function (item, index, array) {
            $('#menu table > tbody:last-child').append('<tr id='+item+'><td>'+item+'</td><td><input type="checkbox" name="screens" value=' + item + '></td></tr>');
        });
        console.log(currentscreens);
    });

    remotesocket.on('screen disconnected', function(screenname) {
        var i = screens.indexOf(screenname);
        if (i > -1) {
            screens.splice(i, 1);
            $('#' + screenname).remove();
        }
    });
}

function jerkTiltLR() {
    if (window.DeviceOrientationEvent) {
        document.getElementById("doEvent").innerHTML = "DeviceOrientation";
        // Listen for the deviceorientation event and handle the raw data
        window.addEventListener('deviceorientation', function(eventData) {
        // gamma is the left-to-right tilt in degrees, where right is positive
        var tiltLR = eventData.gamma;

        // call our orientation event handler
        // deviceOrientationHandler(tiltLR, tiltFB, dir);
        document.getElementById("doTiltLR").innerHTML = Math.round(tiltLR);

        // Apply the transform to the image
        var logo = document.getElementById("imgLogo");
        logo.style.webkitTransform = "rotate("+ tiltLR +"deg)";
        logo.style.MozTransform = "rotate("+ tiltLR +"deg)";
        logo.style.transform = "rotate("+ tiltLR +"deg)";

        gammaCurrent = tiltLR;

      }, false);
    } else {
      document.getElementById("doEvent").innerHTML = "Not supported."
    }
}

function jerkTiltLRUpdate() {
    setInterval(function(){
        var diff = gammaCurrent - gammaOld;
        if (diff > 10) {
            currentImage = (currentImage + 1) % imageCount;
            remotesocket.emit('image selection in room', roomname, currentImage);
            gammaOld = gammaCurrent;
        } else if (diff < -10) {
            currentImage = (imageCount - currentImage - 1) % imageCount;
            remotesocket.emit('image selection in room', roomname, currentImage);
            gammaOld = gammaCurrent;
        }
        console.log("Updating...");
    }, 40);
}

$(document).ready(jerkTiltLRUpdate);
