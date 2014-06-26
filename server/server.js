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
var uiHTMLPath = '/../index.html';
var uiHTML;
var connectionHandler;

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
		startServer(conn);
	} else {
		console.log("Unable to connect to database -- Server not started.");
	}
}
function startServer(conn) {
	server = app.listen(3000, function() {
		console.log('Listening on port %d', server.address().port);
		// Start socket.io
		startSocketIO(conn);
	});
}
function startSocketIO(conn) {
	var sockets = io.listen(server).sockets;
	whiteboard.initializeModels(conn);
	connectionHandler = new whiteboard.NewConnectionHandler(sockets);
	connectionHandler.start();
}

bootstrap();

app.param('whiteboardId', function(req, res, next, whiteboardId) {
	req.whiteboardId = whiteboardId;
	next();
});

app.param('fileId', function(req, res, next, fileId) {
	req.fileId = fileId;
	next();
});

app.get('/whiteboard/:whiteboardId', function(req, res, next) {
	res.type('text/html');
	res.send(uiHTML);
});

app.get('/js/:fileId', function(req, res, next) {
	res.type('text/javascript');
	fs.readFile(__dirname + '/../js' + req.fileId, function(err, data) {
		res.send(data);
	});
});

app.get('/style/:fileId', function(req, res, next) {
	res.type('text/css');
	fs.readFile(__dirname + '/../style' + req.fileId, function(err, data) {
		res.send(data);
	});
});

app.use(function(req, res, next) {
	res.send(404, "Couldn't find the page you were looking for.");
});