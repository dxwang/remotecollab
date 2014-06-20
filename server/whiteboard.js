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
	
// Connect to the db
var mongo = require('mongodb');
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
module.exports.createWhiteboard = createWhiteboard;
