const cpen400a = require('./cpen400a-tester.js');
const ws = require('ws');
const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('./Database');
const SessionManager = require('./SessionManager.js');
const ObjectId = require('mongodb').ObjectID;
const crypto = require('crypto');
const { response } = require('express');

var db = new Database(
	'mongodb://localhost:27017',
	'cpen400a-messenger'
)

const broker = new ws.Server({
	port: 8000,
	clientTracking: true,	//	Enable clients array for client tracking, buffer.clients exists now
});

var messages = {}; 				// Empty array to hold messages

var messageBlockSize = 10;		// indicates how many messages to include in a conversation.

// =========== Assignment 5 added variables ===================
var sessionManager = new SessionManager();

// ====================================================================
// Assignment 5 Global methods 
// ====================================================================
function isCorrectPassword(password, saltedHash) {
	var salt = saltedHash.slice(0,20);		// Length of salted is 20 chars
	var hash = saltedHash.slice(20);		// length of hash is 44 chars
	var saltedPassword = password + salt;	// The "salted password" is simply the concatenation of "plaintext password" (password) and the salt
	var userHash = crypto.createHash('sha256').update(saltedPassword).digest('base64');

	if(hash == userHash)
		return true;		// Password id correct
	else
		return false;		// Password is incorrect
}
// ======================================
// Error handler for middleware
// ======================================
function middlewareErrorHandler(err, request, response, next) {
	if(err instanceof SessionManager.Error) {
		if(request.headers.accept == 'application/json'){
			response.status(401).send(err.stack);
		} else {
			response.redirect('/login');
		}
	} else {
		// There is a different error, return 500
		response.status(500).send("Error code 500 occurred");
	} 

}

// Initialize mesages array with chatroom _ids from the database
db.getRooms().then((result) => {
	result.forEach((chatroom) => {
		messages[chatroom._id] = [];
	})

	console.log(messages);
})

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug
app.use(middlewareErrorHandler);	// 
app.use('/+', sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/+'));
app.use('/index.html', sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/index.html'));
app.use('/index', sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/index.html'));
app.use('/app.js', sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/app.js'));
app.use('/profile', sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/profile.html'));



// ======================================================================
// GET method to call Database.getLastConversation function with specified room_id
// request.params in the form {'room_id': 'room-1'} where room-1 is the ID of a room
//====================================================================
app.get('/chat/:room_id/messages', sessionManager.middleware,middlewareErrorHandler,function(request, response) {

	var room_id = request.params['room_id'];	// Get the room_id from the params of the GET request
	var before = request.url.split("?")[1];		// Extract the before search, if is exists
	if(before) {
		before = before.slice(7);	// Extract the milliseconds
		// Get the lastconversation from the database
		db.getLastConversation(room_id, before).then(result => {
			response.status(200).json(result);
		})
	} else {// Before must not have been provided
	
		// Get the lastconversation from the database
		db.getLastConversation(room_id).then(result => {
			response.status(200).json(result);
		})
	}
})	// End of '/chat/:room_id/messages'

// ======================================================================
// GET method to call Database.getRoom function with specified room_id
// request.params in the form {'room_id': 'room-1'} where room-1 is the ID of a room
//====================================================================
app.get('/chat/:room_id', sessionManager.middleware,middlewareErrorHandler,function(request, response) {

	db.getRoom(request.params['room_id']).then(result => {

		console.log("=====================================")
		console.log("Inisde the resolved promise for getRoom");
		console.log("Promise resolved from Database.getRoom, data is: ");
		console.log(result);

		if(result)
			response.status(200).send(result);
		else {
			// There must be no room with that ID
			response.status(404).send("Room " + request.params['room_id'] + " was not found");
		}
	},
	(error) => {
		console.log("=====================================")
		console.log("Inisde the ERRORED promise for getRoom");
		console.log(error);
	})
}) // End of GET for /chat/:room_id

//=============================================
// app route to GET, POST via '/chat' endpoint
//=============================================
app.get('/chat', sessionManager.middleware, middlewareErrorHandler,function(request, response) {
	console.log("Inisde app.route GET");

	// Get chatrooms from the database
	db.getRooms().then((result) => {
		//console.log("Inisde the resolved promise for getRooms");
		result.forEach(room => {
			room.messages = messages[room._id];
		});
			//console.log("The rooms to be returned are");
			//console.log(result);
		response.status(200).json(result);
	})
	//response.status(200).json(rooms);
}) // end of GET /chat

//=====================================================
// POST method to add a new room to the server/database
//=====================================================
app.post('/chat',sessionManager.middleware,middlewareErrorHandler,function(request, response) {
	
	if(!request.body.name) {
		response.status(400).send("Bad request, property 'name' not found");
	} else {
		console.log("********************* Data contains a name property *********************");
		console.log(request.body);
		var data = request.body;	//	Convert JSON string into JS Object

		db.addRoom(data).then((result) => {
			var room = result;
			console.log("=====================================")
			console.log("Inisde the resolved promise for addRoom");
			console.log("The room that was added to the Database is");
			console.log(room);
			if(result != null) {
				messages[room._id] = [];
				console.log(messages)
				response.status(200).send(room);	//	Send room parameter object back to client
			} else {
				// Result must be null
				response.status(400).send("Bad request, addRooms returned NULL");
			}
		})
		
	}
}) // End of POST

// =========================
// Added for assignment 5: /profile endpoint, protected with the session middleware.
// This endpoint simply returns an object containing a property username - 
// this value can be obtained from the Request object you augment in the session middleware.
// ====================================================================================
app.get('/profile',sessionManager.middleware,middlewareErrorHandler, function(request, response) {

	//console.log(" ~~~~ Inside /profile GET endpoint ~~~~~");
	//console.log(" The request username and session cookie are ");
	//console.log(request['username']);
	//console.log(request['session']);
	var user = {'username' : request.username};
	response.send(user);
})

// ================== ENDPOINTS ADDED FOR ASSIGNMENT 5 ===========================
// Post endopoint where login form will be submitted to from the Client
// Check if the user exists, and if they do, check their password 
// ===============================================================================
app.route('/login')
.post(function(request, response) {

	var currentUser = request.body;
	//console.log("==== Inside /login ENDPOINT ================");
	//console.log(currentUser);
	// Search the database for the user
	db.getUser(currentUser.username).then(user => {

		if(user != null) {	// User exists
			var saltedHash = user['password'];
			var correct = isCorrectPassword(currentUser.password, saltedHash);	// Check if password was correct

			if(correct){	// The password was correct
				sessionManager.createSession(response, user['username']);
				response.redirect('/');	// Redirect to home page

			} else {
				// Password must not be correct
				response.redirect('/login');	// Redirect back to login page
			}
		} else {	// User must not exist

			console.log(" User does not exist..");
			response.status(404).redirect('/login');
		}
	})
}); // End of /login ENDPOINT

app.route('/logout')
.get(function(request, response) {

	sessionManager.deleteSession(request);		// Remove session from server
	response.redirect('/login');				// Redirect to login page
})

broker.on("connection", function connection(currentClient) {
	//console.log("inside broker connection event, client is:  ", currentClient);

	// =========================
	// Added for assignment 5: Check cookie, if not valid, close the connection
	// ========================
	console.log("~~~~ Inside broker connection handler ~~~~~")

	var cookie = (arguments[1].headers)['cookie'];
	if(cookie)
		var userToken = cookie.split('=')[1];
	var cookieValidUsername = sessionManager.getUsername(userToken);
	console.log(" the username is ", cookieValidUsername);
	
	if(cookieValidUsername == null || cookie == undefined)
		currentClient.close();

	currentClient.on('message', function incoming(message) {	//	Client sends a message, push to all clients except message sender
		console.log("Received message: ", message);
		var msg = JSON.parse(message);
		// Sanitizing message to combat XSS attack
		msg['text'] = msg['text'].replace(/</g, "");
		msg['text'] = msg['text'].replace(/>/g, "");
		msg['username'] = cookieValidUsername;		// Overwrite the username field with the current user
		console.log(msg);

		//FOREACH::: Send message to each client in broker EXCEPT the currentClient sending the message
		broker.clients.forEach(function each(client) {
			if(client !== currentClient && client.readyState === ws.OPEN) {
				client.send(JSON.stringify(msg));
			}
		}); // end of foreach

		messages[msg.roomId.toString()].push({username: msg.username, text: msg.text});	//	Add message to messages object array of roomId

		// ==================================
		// ADDED IN ASSIGNMENT 4
		// ==================================
		if(messages[msg.roomId.toString()].length == messageBlockSize) {
			var conversation = {
				"room_id": msg.roomId.toString(),
				"timestamp": Date.now(),
				"messages": messages[msg.roomId.toString()]

			};

			// Add the new conversation to the database
			db.addConversation(conversation).then(result => {
				console.log("=====================================")
				console.log("Inisde the resolved promise for addConversation");
				//console.log("The result is ");
				//console.log(result);

				// Empty the messages array for the given room_id
				messages[msg.roomId.toString()] = [];
			})
		}
	});

});

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

//	Used for testing Assignment 3, 4
cpen400a.connect('http://35.183.65.155/cpen400a/test-a5-server.js');
cpen400a.export(__filename, { app, messages, broker, db, messageBlockSize, sessionManager, isCorrectPassword }); // sessionManager, isCorrectPassword
