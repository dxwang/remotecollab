/*  RemoteCollab - Collaborative Whiteboard
    Copyright (C) 2014 Aruth Kandage, David Wang, Ushhud Khalid, Vithushan Namasivayasivam

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>. */

var fs = require('fs');
var dbconn = require('./dbconn.js');
var whiteboard = require('./whiteboard.js');
var express = require('express');
var app = express();
var server;
var io = require('socket.io');
var sockets;
var uiHTMLPath = '/../www/index.html';
var uiHTML;

// Server initialization
function bootstrap() {
	loadUIHTML();
}
function loadUIHTML() {
	fs.readFile(__dirname + uiHTMLPath, function(err, data) {
		if(!err) {
			uiHTML = data;
			connectToDB();
		} else {
			console.log("Could not load index.html");
		}
	});
}
function connectToDB() {
	dbconn.connectToMongoDB(onConnectedToDB);
}
function onConnectedToDB(conn) {
	if(conn._db) {
		startServer();
	} else {
		console.log("Unable to connect to database -- Server not started.");
	}
}
function startServer() {
	server = app.listen(3000, function() {
		console.log('Listening on port %d', server.address().port);
		// Start socket.io
		startSocketIO();
	});
}
function startSocketIO() {
	sockets = io.listen(server).sockets;
}

bootstrap();

app.param('whiteboardId', function(req, res, next, whiteboardId) {
	req.whiteboardId = whiteboardId;
	next();
});

app.get('/whiteboard/:whiteboardId', function(req, res, next) {
	res.type('text/html');
	res.send(uiHTML);
});

app.use(function(req, res, next) {
	res.send(404, "Couldn't find the page you were looking for.");
});