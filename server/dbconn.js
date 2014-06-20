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
module.exports.DBConn = DBConn;
module.exports.MongoDBConn = MongoDBConn;
module.exports.connectToMongoDB = connectToMongoDB;
	
function DBConn() {
}

// Connect to the database and call the callback when done
DBConn.prototype.connect = function(callback) {
	// Nothing
}
DBConn.prototype.getDBHandle = function() {
	// Nothing
}

function MongoDBConn(mongoDriver,serverUrl,dbName,port) {
	DBConn.call(this);
	this._db; // undefined
	this.mongoDriver = mongoDriver;
	this.serverUrl = serverUrl;
	this.dbName = dbName;
	this.port = port;
}

MongoDBConn.prototype = new DBConn();
MongoDBConn.prototype.connect = function(callback) {
	var mongoClient = this.mongoDriver.getMongoClient();
	var dbConnObj = this;
	mongoClient.connect(this.serverUrl + ":" + this.port + "/" + this.dbName, function(err, db) {
		if(!err) {
			console.log("Connected to database: " + dbConnObj.dbName);
			dbConnObj._db = db;
		} else {
			console.log("Error occurred trying to connect to MongoDB");
		}
	  
		callback(dbConnObj);
	});
}
MongoDBConn.prototype.getDBHandle = function() {
	return this._db;
}

function connectToMongoDB(callback) {
	var dbConn = new MongoDBConn(MongoDriver.getInstance(), "mongodb://localhost", "whiteboard", 27017);
	dbConn.connect(callback);
}

// Mongo Driver - Singleton
var MongoDriver = (function() {
	var instance;
	
	function initialize() {
		var mongo = require("mongodb");
		
		return {
			getMongoClient: function() {
				return mongo.MongoClient;
			}
		};
	}
	
	return {
		getInstance: function() {
			if(!instance) {
				instance = initialize();
			}
			return instance;
		}
	};
})();