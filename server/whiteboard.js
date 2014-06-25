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
var db;
var ObjectId;
var PointModel;
var LineModel;
var BoardModel;
var Counter;
	
function initializeModels(dbConn) {
	var mongoose = dbConn.mongoDriver.getMongoose();
	ObjectId = mongoose.Types.ObjectId;
	db = dbConn._db;

	var Schema = mongoose.Schema;
	var PointSchema = new Schema({x: Number, y: Number});
	var LineSchema = new Schema({id: Number, colour: String, line: [PointSchema]});
	var BoardSchema = new Schema({id: Number, data: [LineSchema], lineCount: Number});
	var CounterSchema = new Schema({id: String, count: Number});
	
	PointModel = mongoose.model('Point', PointSchema);
	LineModel = mongoose.model('Line', LineSchema);
	BoardModel = mongoose.model('Board', BoardSchema);
	Counter = mongoose.model('Counter', CounterSchema);
	
	// Atomic count for board id's
	Counter.count({id: "boards"}, function(err, count) {
		if(!err && count == 0) {
			var newCounter = new Counter({id: "boards", count: 0}); 
			newCounter.save(function(err) {
				if(!err) {
					console.log("Created board counter");
				}
			});
		}
	});
}
module.exports.initializeModels = initializeModels;
	
/* 
 * Route new connections to appropriate whiteboard handler 
 */
function NewConnectionHandler(sockets) {
	this.sockets = sockets;
	this.whiteboardHandlers = {}; // map[whiteboardId:String] -> handler:WhiteBoardHandler
}
NewConnectionHandler.prototype.constructor = NewConnectionHandler;
NewConnectionHandler.prototype.handleNewUserMessage = function(connHandler,socket) {
	return function(data) {
		var whiteboardId = parseInt(data.whiteboardId);
		if(!isNaN(whiteboardId)) {
			WhiteBoards.get(whiteboardId, function(whiteboard) {
				if(whiteboard) {
					connHandler.handleNewUser(whiteboard, socket);
				} else {
					// No such whiteboard exists, create new one
					WhiteBoards.create(function(whiteboard) {
						if(whiteboard) {
							connHandler.handleNewUser(whiteboard, socket);
						} else {
							socket.emit('remotecollab error', {error: "Could not create new whiteboard"});
						}
					});
				}
			});
		} else {
			// Gave an invalid whiteboard id, create a new one
			WhiteBoards.create(function(whiteboard) {
				if(whiteboard) {
					connHandler.handleNewUser(whiteboard, socket);
				} else {
					socket.emit('remotecollab error', {error: "Could not create new whiteboard"});
				}
			});
		}
	};
}
NewConnectionHandler.prototype.handleNewUser = function(whiteboard, socket) {
	if(whiteboard) {
		if(!this.whiteboardHandlers[whiteboard.id]) {
			this.whiteboardHandlers[whiteboard.id] = new WhiteboardHandler(whiteboard);
		}
		this.whiteboardHandlers[whiteboard.id].addNewUser(socket);
	}
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
 function WhiteboardHandler(whiteboard) {
	this.whiteboard = whiteboard;
	this.users = {}; // current users
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
 
	socket.join(this.whiteboard.id);
	this.users[userId] = true;
	socket.userId = userId;
	socket.whiteboardHandler = this;
	
	socket.emit('you joined', { "whiteboardId" : this.whiteboard.id });
	socket.emit('your user id', { "userId" : userId });
	socket.on('disconnect', this.handleDisconnect(socket));
	
	console.log("User " + userId + " joined whiteboard " + this.whiteboard.id);
 }
 WhiteboardHandler.prototype.handleDisconnect = function(socket) {
	return function(){
		delete socket.whiteboardHandler.users[socket.userId];
		console.log("User " + socket.userId + " disconnected from whiteboard " + socket.whiteboardHandler.whiteboard.id);
	};
 }
 
 var WhiteBoards = {
	nextBoardId: function(callback) {
		Counter.findOneAndUpdate({id: "boards"}, {$inc: {count: 1}}, function(err, counter) {
			if(!err && counter) {
				callback(counter.count);
			} else {
				callback();
			}
		});
	},
	get: function(id, callback) {
		BoardModel.findOne({"id": id}, function(err, board) {
			if(!err && board) {
				callback(board);
			} else {
				console.log("Couldn't find board with id " + id);
				callback();
			}
		});
	},
	create: function(callback) {
		WhiteBoards.nextBoardId(function(whiteboardId) {
			if(whiteboardId) {
				var whiteboard = new BoardModel({id: whiteboardId, data: [], lineCount: 0});
				whiteboard.save(function(err, wb) {
					if(!err && wb) {
						console.log("Created new whiteboard (id " + whiteboardId + ")");
						callback(wb);
					} else {
						console.log("Could not create new whiteboard");
						console.log(err);
						callback();
					}
				});
			} else {
				console.log("Could not generate new whiteboard id");
			}
		});
	},
	addLine: function(whiteboard,callback) {
	
	},
	eraseLine: function(whiteboard,callback) {
	 
	}
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
