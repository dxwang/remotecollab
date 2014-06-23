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
	
/* 
 * Route new connections to appropriate whiteboard handler 
 */
function NewConnectionHandler(sockets,dbConn) {
	this.sockets = sockets;
	this.db = dbConn._db;
	this.whiteboardHandlers = {}; // map[whiteboardId:String] -> handler:WhiteBoardHandler
}
NewConnectionHandler.prototype.constructor = NewConnectionHandler;
NewConnectionHandler.prototype.handleNewUserMessage = function(connHandler,socket) {
	return function(data) {
		var whiteboardId = data.whiteboardId;
		if(whiteboardId) {
			if(!connHandler.whiteboardHandlers[whiteboardId]) {
				connHandler.whiteboardHandlers[whiteboardId] = new WhiteboardHandler(whiteboardId,connHandler.db);
			}
			connHandler.whiteboardHandlers[whiteboardId].addNewUser(socket);
		}
	};
}
NewConnectionHandler.prototype.handleNewConnection = function(connHandler) {
	return function(socket) {
		socket.on('new user', connHandler.handleNewUserMessage(connHandler,socket));
	};
}
NewConnectionHandler.prototype.start = function() {
	this.sockets.on('connection', this.handleNewConnection(this));
}

module.exports.NewConnectionHandler = NewConnectionHandler;

/*
 * Handler for messages from the client connected to a whiteboard
 */
 function WhiteboardHandler(whiteboardId,db) {
	this.whiteboardId = whiteboardId;
	this.db = db;
	this.users = {}; // current users
 }
 WhiteboardHandler.prototype.setWhiteboardId = function(whiteboardID) {
	this.whiteboardId = whiteboardId;
 }
 WhiteboardHandler.prototype.getWhiteboardId = function() {
	return this.whiteboardId;
 }
 WhiteboardHandler.prototype.getUniqueUserId = function() {
	var userId = "Guest";
	var digits = ['0','1','2','3','4','5','6','7','8','9'];
	do {
		// Tack on 4 random digits
		for(var i=0; i < 4; i++) {
			userId += digits[Math.floor(Math.random() * 10)];
		}
	} while(this.users[userId]);
	return userId;
 }
 WhiteboardHandler.prototype.addNewUser = function(socket) {
	var userId = this.getUniqueUserId();
 
	socket.join(this.whiteboardId);
	this.users[userId] = true;
	socket.userId = userId;
	socket.whiteboardHandler = this;
	
	socket.emit('you joined', { "whiteboardId" : this.whiteboardId });
	socket.emit('your user id', { "userId" : userId });
	socket.on('disconnect', this.handleDisconnect(socket));
	
	console.log("User " + userId + " joined whiteboard " + this.whiteboardId);
 }
 WhiteboardHandler.prototype.handleDisconnect = function(socket) {
	return function(){
		delete socket.whiteboardHandler.users[socket.userId];
		console.log("User " + socket.userId + " disconnected from whiteboard " + socket.whiteboardHandler.whiteboardId);
	};
 }
 
/* 
	
// Connect to the db
/*var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var bson = mongo.BSONPure;
var mongoPort = 27017;
var dbName = "whiteboard";
var db;

var bootstrap = function(next) {
	mongoClient.connect("mongodb://localhost:" + mongoPort + "/" + dbName, function(err, _db) {
	  if(!err) {
		db = _db;
		console.log("Connected to database: " + dbName);
		// Create the whiteboard collection if necessary
		db.createCollection("whiteboards", {strict:true}, function(err, collection) {
			if(!err) {
				console.log("Created whiteboards collection!");
			}
		});
		
		return next();
	  } else {
		console.log("Error occurred trying to connect to DB");
	  }
	});
}
	
var exists = function(id, callback) {
	var objectId;
	
	try {
		objectId = new bson.ObjectID(id);
	} catch(err) {
		callback(false);
		return;
	}

	db.collection("whiteboards").find({_id : objectId}, function(err, cursor) {
		if(!err) {
			cursor.toArray(function(err, docs) {
				if(!err) {
					callback((docs.length == 1));
				}
			});
		}
	});
}

var createWhiteboard = function() {
	var whiteboardDoc = {};

	db.collection("whiteboards").insert(whiteboardDoc, {w:1}, function(err, result) {
		if(!err) {
			console.log("Created whiteboard " + whiteboardDoc._id);
		}
	});
}

module.exports.exists = exists;
module.exports.createWhiteboard = createWhiteboard;*/
