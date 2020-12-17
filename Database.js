const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver
const ObjectId = require('mongodb').ObjectID;

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen400a app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			//console.log("====================== Inside Database getRooms ======================");
			db.collection('chatrooms').find().toArray((err, result) => {
				//console.log(result);	
				resolve(result);
			});
			
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			console.log("====================== Inside Database getRoom ======================");
			//console.log("The room_id is ", room_id);
			if(typeof room_id === typeof ObjectId) {
				console.log("The roomID IS of type ObjectID...");
				db.collection('chatrooms').findOne({_id: room_id}).then(result => {

					//console.log("The result of the getRoom call is ");
					//console.log(result);
					if(reject != null)
						resolve(result);
					else
						resolve(null);
				});
			} 
			else {
					console.log("The roomID is not of type ObjectID...");
					console.log(typeof room_id);
					db.collection('chatrooms').findOne({_id: room_id.toString()}).then(result => {

						console.log("The result of the room_id findOne call is ");
						console.log(result);
						if(result != null)
							resolve(result);
						
							// Length of ObjectId MUST be == 24
						else if(room_id.length == 24){
							db.collection('chatrooms').findOne({_id: ObjectId(room_id.toString())}).then(result => {
								console.log("The result of the ObjectID() findOne call is ");
								console.log(result);
								if(reject != null)
									resolve(result);
								else
									resolve(null);
							}); // End of findOne ObjectID(room_id)
						} else {
							resolve(null);
						}

					}); // End of findOne room_id
			}
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
			console.log("====================== Inside Database addRoom ======================");
			//console.log(room);
			 // Check if room has the name property
			if(room['name']) {
				//console.log("The room has a name property, adding to database");

				// Insert new room into the chatrooms collection
				db.collection('chatrooms').insertOne(room).then((result) =>{

					// Find the new room in the collection
					db.collection('chatrooms').findOne({'_id': result['insertedId']}).then((result) =>{

						var newRoom = result;
						//console.log("Room returned from the database is: ", newRoom);
						resolve(newRoom);
					}) // End of finOne promise
				}); // End of insertOne promise
			} else {
			reject(new Error("The room object has no name property"));
			}

		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			console.log("====================== Inside Database getLastConversation ======================");
			if(!before) {
				before = Date.now();
				console.log("There is a new before time! it is: ", before);
			}
			
				console.log("before time is");
				console.log(before);
			db.collection('conversations').find({'room_id': room_id}).toArray((err, items) =>{
				console.log("the conversations array is");
				console.log(items);
				var conversations = items;

				if(conversations.length > 0) {
					var closestConvo;						// Set first element at clostest Convo by default
					var closestTime;		// Calculate first closest time
					conversations.forEach((convo) => {

						//console.log(" Inside for in loop")
						if(convo['timestamp'] < before) {

							// there must be a current ClosestConvo, check if this one is closer to 'before'
							if(closestTime) {

								// Check if this convo is closer to 'before' milliseconds
								if(before - convo['timestamp'] < closestTime) {
									closestConvo = convo;
									closestTime = before - convo['timestamp'];
									console.log("There is a new closest conversation!!");
									//console.log(closestConvo);
									console.log(closestTime);
								} // End of if
							} else {
								console.log("Initial closest conversation and time are set");
								closestConvo = convo;
								closestTime = before - convo['timestamp'];
								//console.log(closestConvo);
								console.log(closestTime);
							} // end of else
						} // End of if
					}) // End of forEach()

					console.log("Closest conversation is");
					console.log(closestConvo);
					if(closestConvo === undefined)
						resolve(null);
					resolve(closestConvo);	// Resolve the conversations closest to 'before' time

				} else {
					resolve(null);
				}

			});			
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			console.log("====================== Inside Database addConversation ======================");
			console.log("The conversation to be added is");
			console.log(conversation);
			if(conversation['room_id'] && conversation['timestamp'] && conversation['messages']) {

				db.collection('conversations').insertOne(conversation).then(result => {
					//console.log("Finsihed adding new conversation, result is");
					//console.log(result); 
					db.collection('conversations').findOne({'_id': result['insertedId']}).then(result => {
						console.log("The conversation added to the database was");
						console.log(result);
						resolve(result);
					}) // End of conversations findOne
				}) // End of conversations insertOne

			} else {
				reject(new Error("The conversation does not contain the correct properties"));
			}
		})
	)
}

Database.prototype.getUser = function(username) {

	return this.connected.then(db =>
		new Promise((resolve, reject) => {

			db.collection('users').findOne({'username': username}).then(user => {
				if(user)
					resolve(user);
				else
					resolve(null);
			})
		})
	)
}

module.exports = Database;