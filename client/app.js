
//=======================
// Global variables
// ======================
//const chatrooms = require("../server.js");
const imagePATH = 'assets/chatbubble1-logo.png';
const idTemplate = 'room-';             //  Template for room ID
const profile = {username: 'Seth'};     //  Profile object to store username 
var Service = {
    origin: window.location.origin,
    getAllRooms: function() {
        return new Promise((resolve, reject) =>{
            var chatRequest = new XMLHttpRequest(); //  Create a new AJAX request object
            chatRequest.open("GET", this.origin + '/chat', true);   //  true = async request
            
            chatRequest.onload = function(err) {                //  Handle when the request returns
                if (chatRequest.status == 200) {
                    resolve(JSON.parse(chatRequest.response));
                } else {
                    reject(new Error(chatRequest.responseText));
                }
            }
            chatRequest.onerror = function(err) {
                reject(new Error("There was a server side error in chatRequest"));
            }    //  Handle a server side error

            chatRequest.send();     //  Send the request
        })

    },

    //=====================================
    // Method to send new room that was added, to the server
    //=====================================
    addRoom: function(data) {   //  PARAMS: data - Object(name: , image: )

        return new Promise((resolve, reject) =>{
            var xhr = new XMLHttpRequest(); //  Create a new AJAX request object
            xhr.open("POST", this.origin + '/chat', true);                              //  true = async request
            xhr.setRequestHeader('Content-type', 'application/json');                   // Set the Content-Type header to application/json
            xhr.onload = function() {                                                //  Handle when the request returns
                if (xhr.status == 200) {
                    //if (xhr.getResponseHeader("Content-type") === JSON)
                resolve(JSON.parse(xhr.response));          //  Convert incoming JSON to Object
                } else {
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.onerror = function(err) {
                reject(new Error("There was a server side error in xhr"));
            }    //  Handle a server side error

            xhr.send(JSON.stringify(data));     //  make sure to serialize the object into a JSON string before sending
        })
    },

    //===================================================================================
    // METHOD: getLastConversation 
    // accepts 2 arguments: roomId and before
    // makes an AJAX GET request to the /chat/:room_id/messages endpoint,
    // encoding the before parameter as a query string in the URL.
    // returns a Promise that resolves to the Conversation object returned by the server.
    //=====================================================================================
    getLastConversation: function(roomId, before) {
        return new Promise((resolve, reject) => {

            var conversationRequest = new XMLHttpRequest(); //  Create a new AJAX request object
            conversationRequest.open("GET", this.origin + '/chat/' + roomId + "/messages?before=" + encodeURIComponent(before), true);   //  true = async request
            conversationRequest.onload = function(err) {                //  Handle when the request returns
                if (conversationRequest.status == 200) {
                    resolve(JSON.parse(conversationRequest.response));
                } else {
                    reject(new Error(conversationRequest.responseText));
                }
            }
            conversationRequest.onerror = function(err) {
                reject(new Error("There was a server side error in chatRequest"));
            }    //  Handle a server side error

            conversationRequest.send();     //  Send the request

        });
    }, // End of getLastConversation

    // =============================================
    // Assignemt 5: makes a GET request to the /profile endpoint
    // handle the response just like the other functions in the Service object do
    // 
    // =============================================
    getProfile: function() {
        return new Promise((resolve, reject) => {
            var profileRequest = new XMLHttpRequest();  // Create new AJAX request object
            profileRequest.open("GET", this.origin + '/profile', true);

            profileRequest.onload = function(err) {                //  Handle when the request returns
                if (profileRequest.status == 200) {
                    resolve(JSON.parse(profileRequest.response));
                } else {
                    reject(new Error(profileRequest.responseText));
                }
            }
            profileRequest.onerror = function(err) {
                reject(new Error("There was a server side error in profileRequest"));
            }    //  Handle a server side error

            profileRequest.send();     //  Send the request

        });// End of Promise
    } // End of getProfile function

} // End of Service Object

// ===================== ADDED FOR ASSIGNMENT 4 ============================
// generator function will "remember" the last conversation fetched,
// and incrementally fetch the conversations as the user scrolls to the top of the chat view,
//  until there is no more conversation blocks to be read.
function* makeConversationLoader(room) {
    //var before = Date.now();
    let before = room.currentTime;
    var conversation = null;
    do {
        room.canLoadConversation = false;       // Defined in Room Class

        yield new Promise((resolve, reject) => {
            Service.getLastConversation(room.id,before).then(result =>{     // Call getLastConversation with roomId and before
                if(result === null) {               // Conversation is null
                    conversation = null;
                    resolve(null);
                } else {                            // Conversation is not null
                    before = result['timestamp'];
                    conversation = result;
                    if(result) {
                        room.canLoadConversation = true;
                        room.addConversation(conversation);     // Add the conversation to the room
                        resolve(conversation);
                    } else
                        resolve(null);
                } // End of else
            }); // End of .then()
        }); // end of Promise
    } while(conversation != null);
    return; // Conversation must be null
} // End of makeConversationLoader function

//==============================
//GLOBAL HTML FOR EACH PAGE
//==============================
const lobbyHTML = `<div class="content">
                        <ul class="room-list">
                        <li>
                            <a href="#/chat/room-1"><img alt="html5" src="assets/HTML5-logo.png"><span>Room 1</span></a>
                        </li>
                        <li>
                            <a href="#/chat/room-2"><img alt="" src="assets/stackoverflow-logo.png"><span>Room 2</span></a>
                        </li>
                        <li>
                            <a href="#/chat/room-3"><img alt="Everyone in CPEN400A" src="assets/everyone-icon.png"><span>Room 3</span></a>
                        </li>
                        <li>
                            <a href="#/chat/room-4"><img alt="Everyone in CPEN400A" src="assets/everyone-icon.png"><span>Room 4</span></a>
                        </li>
                        </ul>

                        <div class="page-control">
                            <input id="room-name" type="text" placeholder="Enter a room name...">
                            <button id="create-room">Create Room</button>
                        </div>
                    </div>`;
const chatHTML =  `<div class="content">
                        <h4 class="room-name">Room 44</h4>

                        <div class="message-list">
                            <!--Other Users' Message box-->
                            <div class="message other-message">
                                <span class="message-user">Brooke</span>
                                <span class="message-text">Hello</span>
                            </div>
                            <!--Current User's Message box-->
                            <div class="message my-message">
                                <span class="message-user">Seth</span>
                                <span class="message-text">Hey</span>
                            </div>
                        </div>

                        <div class="page-control">
                            <textarea id="new-message" placeholder="Type a message..."></textarea>
                            <button id="send">Send</button>
                        </div>
                    </div>`;
    
const profileHTML = `<div class="content">
                        <div class="profile-form">
                            <div class="form-field">
                                <label>Username</label>
                                <input id="username-input" type="text">
                            </div>

                            <div class="form-field">
                                <label id="password">Password</label>
                                <input id="password-input" type="password">
                            </div>

                            <div class="form-field">
                                <label>Avatar Image</label>
                                <input id="avatar-input" type="file">
                            </div>
                        </div>
                        <div class="page-control">
                            <button id="save-button">Save</button>
                        </div>
                    </div>`;
//===================================================

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

//  ==============================
//  Class for Lobby page
//  ==============================
class LobbyView {

    constructor(lobby) {
        var self = this;
        this.lobby = lobby;
        this.lobby.onNewRoom = function(room){
            //  Create new room list element
            const newRoom = createDOM(
                `<li>
                        <a href="#/chat/`+room.id+`">
                            <img src="`+room.image+`"><span>`+room.name+`</span>
                        </a>
                    </li>`
            );
            //  Append it to the end of the <ul> element in lobby
            self.listElem.appendChild(newRoom);
        }
        this.elem = createDOM(lobbyHTML);
        this.listElem = this.elem.querySelector('ul.room-list');
        this.inputElem = this.elem.querySelector('#room-name');
        this.buttonElem = this.elem.querySelector('#create-room');

        //  Event handlers
        this.buttonElem.addEventListener('click', 
                                         function() { //  When 'Create room' button is clicked, call addRoom    
                                                            //let roomId = (Object.keys(self.lobby.rooms).length + 1);
                                                            //self.lobby.addRoom(roomId, self.inputElem.value); ASSIGNMENT #2 
                                                            var data = {name: self.inputElem.value, image: imagePATH};
                                                            Service.addRoom(data).then(
                                                                (result) => {
                                                                self.lobby.addRoom(result._id, result.name); //  Call addRoom with returned data from server
                                                                },
                                                                (error) => {
                                                                })
                                                            self.inputElem.value = '';
                                                    },
                                         false);
        this.redrawList();
    }
    //  Method to empty contents of this.listElem, 
    //  then populate it dynamically with array of Room objects from lobby.rooms
    redrawList() {
        emptyDOM(this.listElem);
        //  Populate this.listElem with rooms from this.lobby.rooms
        for(var room in this.lobby.rooms) {
            this.listElem.appendChild(
                createDOM(
                    `<li>
                        <a href="#/chat/`+this.lobby.rooms[room].id+`" id="`+this.lobby.rooms[room].id+`">
                            <img src="`+this.lobby.rooms[room].image+`"><span>`+this.lobby.rooms[room].name+`</span>
                        </a>
                    </li>`
                )
            );
        }
    }
}
//  ==============================
//  Class for Chat page
//  ==============================
class ChatView {

    constructor(socket) {
        var self = this;
        this.elem = createDOM(chatHTML);
        this.titleElem = this.elem.querySelector('h4.room-name');
        this.chatElem = this.elem.querySelector('div.message-list');
        this.chatElem.style.minHeight = "50%";
        this.chatElem.style.maxHeight = "100%";
        this.inputElem = this.elem.querySelector('#new-message');
        this.buttonElem = this.elem.querySelector('#send');
        this.room = null;
        this.socket = socket;

        //  Event handlers for sending new messages
        this.buttonElem.addEventListener('click', function(event) {
                                                        self.sendMessage();
                                                        self.inputElem.value = "";
                                                },false);
        this.inputElem.addEventListener('keyup', function(event) {
                                                    if(event.keyCode == 13 && !event.shiftKey) {
                                                        self.sendMessage();
                                                        self.inputElem.value = "";
                                                    }
                                                    
                                                }, false);

        // ============ ADDED FOR ASSIGNMENT 4 ===========================
        // trigger the entire fetch-update-render cycle when the mouse is scrolled up in the chat view
        this.chatElem.addEventListener('wheel', function(event) {
            // Invoke the generator's next function, only if the following conditions are met:
            // The scroll is at the top of the view: self.chatElem.scrollTop === 0
            // Mouse scroll direction is "up":  event.deltaY < 0
            // this.room.canLoadConversation is true
            if(self.room.canLoadConversation && event.deltaY < 0 && self.chatElem.scrollTop === 0) {
                self.room.getLastConversation.next();   // Call rooms Generator function to get next conversation
            }
        })
    }

    //  Method used to add new messages to DOM tree
    sendMessage() {
        var message = this.inputElem.value;
        message = message.replace(/</g, "");
        message = message.replace(/>/g, "");
        this.room.addMessage(profile.username, message);
        this.socket.send((JSON.stringify({roomId: this.room.id, text: message})));  //  Send message to server as JSON string
        this.inputElem.value = '';
    }

    //  Method that update the current chat room's DOM
    //  NOTE: since only ChatView objects call setRoom function, we can use the 'this' keyword, instead of 'self'
    setRoom(room) {
        var self = this;
        this.room = room;
        this.titleElem.innerHTML = room.name;

        //  Add current user's messages to chat
        emptyDOM(this.chatElem);
        for(let i = 0; i < room.messages.length; i++) {
            if(room.messages[i].username === profile.username) {
                this.chatElem.appendChild(createDOM(
                        `<div class="message my-message">
                            <span class="message-user">`+profile.username+`</span>
                            <span class="message-text">`+room.messages[i].text+`</span>
                        </div>`
                ));
            } else { // Must be message from contact
                this.chatElem.appendChild(createDOM(
                        `<div class="message other-message">
                            <span class="message-user">`+room.messages[i].username+`</span>
                            <span class="message-text">`+room.messages[i].text+`</span>
                        </div>`
                ));
            }
        }
        //  assign onNewMessage to a function that adds a new message when on specific chat page
        this.room.onNewMessage =  (message) => {
            
            // Sanitizing message to avoid XSS attack
            message['text'] = message['text'].replace(/</g, "");
            message['text'] = message['text'].replace(/>/g, "");

            if(message.username === profile.username) {
                this.chatElem.appendChild(createDOM(
                        `<div class="message my-message">
                            <span class="message-user">`+profile.username+`</span>
                            <span class="message-text">`+message.text+`</span>
                        </div>`
                ));
            } else { // Must be message from contact
                this.chatElem.appendChild(createDOM(
                        `<div class="message other-message">
                            <span class="message-user">`+message.username+`</span>
                            <span class="message-text">`+message.text+`</span>
                        </div>`
                ));
            }
        }

        this.room.onFetchConversation = (conversation) => {

            var scrollHeightBefore = this.chatElem.scrollTop;    // Scroll height before adding messages
            var messages = conversation['messages'];        // Get messages of conversation
            for(let i = messages.length-1; i >= 0; i--) {
                // Insert the new messages at the top of the chatElem element
                if(messages[i].username == profile.username) {
                    this.chatElem.insertBefore(createDOM(
                        `<div class="message my-message">
                            <span class="message-user">`+messages[i].username+`</span>
                            <span class="message-text">`+messages[i].text+`</span>
                        </div>`
                    ), this.chatElem.firstChild);
                } else {
                this.chatElem.insertBefore(createDOM(
                    `<div class="message other-message">
                        <span class="message-user">`+messages[i].username+`</span>
                        <span class="message-text">`+messages[i].text+`</span>
                    </div>`
                ), this.chatElem.firstChild);
                }
            }
            var scrollHeightAfter = this.chatElem.scrollTop;     // Scroll height after adding the messages
            // Adjsut the scroll height to account for the messages that were added
            var scrollChange = scrollHeightAfter - scrollHeightBefore;
            //this.chatElem.scrollTop = scrollChange;
            this.chatElem.scrollTop = scrollChange;

        }
    }
}

//  ==============================
//  Class for Profile page
//  ==============================
class ProfileView {

    constructor() {

        this.elem = createDOM(profileHTML);

    }
}

//  ==============================
//  Class for Lobby
//  ==============================
class Lobby {
    constructor() {
        this.rooms = {};  //  Associative array of room objects
    }

    //  Method to return Room on this.rooms with id = roomId
    getRoom(roomId) {
        for(let room in this.rooms) {               //  cycle through each key of this.rooms
            if(this.rooms[room].id == roomId) {//  Look at Room object at key == room,  compare its id to roomId
                return this.rooms[room];
            }
        }
    }

    //  Method that creates new Room object and adds it to this.rooms array
    addRoom(id, name, image, messages) {
        if(id in this.rooms)
            return;
        const room = new Room(id, name, image, messages);
        this.rooms[room.id] = room;     //  Append element to this.rooms array
        
        if(this.onNewRoom) {
            this.onNewRoom(room);
        }
    }
}
//  ==============================
//  Class for Room
//  ==============================
class Room {

    constructor(id, name, image = imagePATH, messages = []) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
        this.currentTime = Date.now();

        // ============== ADDED FOR ASSIGNMENT 4 ==================
        this.canLoadConversation = true;
        this.getLastConversation = makeConversationLoader(this)
    }

    //  Method to add message to chat associated with current user
    addMessage(username, text) {
        if(text && text.trim()) {   //  True if text is non-empty && not just whitespace
            
            var message = {               //  create new object with keys:
                username: username,         //  usernameKey: username and
                text: text                  //  textKey: text
            }

            //Protecting against XSS Attack, sanitize the input
            message['text'] = message['text'].replace(/</g, "")
            message['text'] = message['text'].replace(/>/g, "")

            this.messages.push(message);    //  Add message to messsages array

        } else {    //  Text must be empty or whitespace
            return;
        }

        //  If method exists, call it with new message object
        if(this.onNewMessage) {
            this.onNewMessage(message);
        }

    }

    //============ ADDED in Assignment 4 ======================
    // Method to insert the given messages at the beginning of the Room.messages array
    // Make sure the order of messages is chronological.
    // ================================================================
    addConversation(conversation) {

        var messages = conversation['messages'];    // Extract messages from the conversation
        var room_id = conversation['room_id'];      // Get room id
;
        
        // The messages in the conversation will be in the order [ 1, 2, 3, 4, 5 ] where 1 is ondest, 5 is newest
        for(var i = 0; i < messages.length; i++) {
            this.messages.push(messages[i]);     // prepend message to start of the array, starting with 5, end with 1

        }

        // call the onFetchConversation(conversation) event listener callback,
        // which will be assigned later by the ChatView
        if(this.onFetchConversation) {
            this.onFetchConversation(conversation);
        }
    }
}

function main() {

    //===============  Main variables and objects =====================
    var socket = new WebSocket('ws://localhost:8000');
    //var socket = new WebSocket('ws://35.183.65.155:8000');
    const lobby = new Lobby();             //  Create lobby object
    //  Create object for each page
    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView(socket);
    var profileView = new ProfileView();

    socket.onopen = function() {
        alert("[open] Connection established");
        alert("Sending to server");
    };
    socket.addEventListener("message", function(event) {
        var data = JSON.parse(event.data);               //  Convert JSON to Object
        var room = lobby.getRoom((data.roomId).toString());      //  Get room associated with roomId
        room.addMessage(data.username, data.text);  //  Add message to room
    });

    function renderRoute() {

        var hash = window.location.hash;                        //  Store URL of page
        var pageView = document.getElementById("page-view");   //  Get pageView element
        emptyDOM(pageView);                                     //  Empty contents of #page-view div

        //  empty contents of #page-view and insert the appropriate div.content from the correct page
        if(hash === '#/' || hash === '') {
            //  Render Lobby page (index.html)
            
            pageView.appendChild(lobbyView.elem);    //  Add lobby page as last(only) child page-view
            

        } else if(hash.startsWith("#/profile")) {
            //  Render profile page
            pageView.appendChild(profileView.elem);

        } else if(hash.startsWith("#/chat")) {    //  Must me the chat page
            
            //const roomId = idTemplate + hash.substring(12); //  in the form : room-<number>
            const roomId = hash.substring(7); //  in the form : room-<number>
            const room = lobbyView.lobby.getRoom(roomId);   //  Get the room object of which room we will be navigating to
            if(room != null) {
            chatView.setRoom(room);
            }
            //  Render the chat page

            pageView.appendChild(chatView.elem);
        }
        
        //===================================
        //  Console logs to check for errors
        //===================================

    }

    function refreshLobby() {

        Service.getAllRooms().then((result) =>
        {
            for (let room = 0; room < result.length; room++) {

                var lobbyRoom = lobby.getRoom(result[room]._id);

                if(lobbyRoom) {                     //  if room exists and name is different, update name
                    if(lobbyRoom.name != result[room].name) {
                        lobbyRoom.name = result[room].name;
                    }
                    if(lobbyRoom.image != result[room].image) {         //  Update image if image tag is different
                        lobbyRoom.image = result[room].image;
                    }

                } else { //  Add the new room
                    lobby.addRoom(result[room]._id, result[room].name, result[room].image, result[room].messages);            //  Add room to rooms array in lobby   
                }
            }

        });
    }


    renderRoute();
    refreshLobby();
    window.addEventListener('popstate', renderRoute);
    setInterval(refreshLobby, 5000);                    //  Call refreshLobby every second
    Service.getProfile().then(result =>{
        profile['username'] = result['username'];       // Assign returned username to profile username
    });

    //  Used for testing code Assignment 2, 3
    cpen400a.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby, refreshLobby, socket, makeConversationLoader});

}

window.addEventListener('load',main);

