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
	var LineSchema = new Schema({id: Number, color: String, data: [PointSchema]});
	var BoardSchema = new Schema({id: Number, data: [LineSchema]});
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
	
	socket.emit('you joined', { "whiteboardId" : this.whiteboard.id, "yourUserId" : userId });
	console.log("User " + userId + " joined whiteboard " + this.whiteboard.id);
	// Send all stored whiteboard data to the user if necessary
	if(this.whiteboard.data.length > 0) {
		socket.emit('sync', this.whiteboard.data);
	}

	socket.on('draw', this.handleDrawMessage(this, socket));
	socket.on('erase', this.handleEraseMessage(this, socket));
	socket.on('disconnect', this.handleDisconnect(socket));
	socket.on('chat', function(data) {
		data.message = socket.userId + ": " + data.message;
		console.log(data);
		socket.broadcast.emit('chat', data)
	});
 }
 WhiteboardHandler.prototype.handleDrawMessage = function(connHandler, socket) {
	return function(data) {
		var lineData = data.line;
		WhiteBoards.addLine(connHandler.whiteboard, lineData, function(err, whiteboard, line) {
			if(!err) {
				// connHandler.whiteboard = whiteboard;
				socket.emit('line added', { id: line.id });
				socket.to(connHandler.whiteboard.id).emit('draw', {'line': line});
			} else {
				socket.emit('remotecollab error', { error: "Error adding line to whiteboard" });
			}
		});
	};
 }
 WhiteboardHandler.prototype.handleEraseMessage = function(connHandler, socket) {
	return function(data) {
		WhiteBoards.eraseLine(connHandler.whiteboard, data.id, function(success) {
			if(success) {
				socket.emit('erase', { 'id' : data.id });
				socket.to(connHandler.whiteboard.id).emit('erase', { 'id' : data.id });
			} else {
				console.log("Error erasing line (" + data.id + ") from whiteboard " + connHandler.whiteboard.id);
				socket.emit('remotecollab error', { error: "Error erasing line from whiteboard" });
			}
		});
	};
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
	addLine: function(whiteboard,line,callback) {
		var lineModel = new LineModel(line);
		lineModel.id = whiteboard.data.length;
		whiteboard.data.push(lineModel);
		var err;
		callback(err, whiteboard, lineModel);
		/*whiteboard.save(function(err, wb) {
			callback(err, wb, lineModel);
		});*/
	},
	eraseLine: function(whiteboard,id,callback) {
		whiteboard.data.findOneAndRemove({'id' : id }, function(err, removedLine) {
			if(!err && removedLine && removedLine.id == id) {
				callback(true);
			} else {
				callback(false);
			}
		});
	}
 }
 
