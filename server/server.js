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

var dbconn = require('./dbconn.js');
var express = require('express');
var app = express();
var server;
// var whiteboard = require('./whiteboard.js');

// Server initialization
function bootstrap() {
	dbconn.connectToMongoDB(onConnectedToDB);
}
function onConnectedToDB(dbConn) {
	if(dbConn._db) {
		startServer();
	} else {
		console.log("Unable to connect to database -- Server not started.");
	}
}
function startServer() {
	server = app.listen(3000, function() {
		console.log('Listening on port %d', server.address().port);
	});
}

bootstrap();

/*app.param('whiteboardId', function(req, res, next, whiteboardId) {
	req.whiteboardId = whiteboardId;
	next();
});

app.get('/whiteboard/:whiteboardId', function(req, res, next) {
	// Will need to send the client HTML page here
	// with a url field set to the given URL
	res.send("Hello!");
});

app.use(function(req, res, next) {
	res.send(404, "Couldn't find the page you were looking for.");
});*/