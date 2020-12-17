const crypto = require('crypto');

class SessionError extends Error {};

// Anonymous function to parse cookie into key value pairs
const parseCookie = str =>
	str
	.split(';')
	.map(v => v.split('='))
	.reduce((acc, v) => {
		acc[v[0]] = v[1];     //acc is a key-value pair object. key = v[0].trim(), value=v[1].trim
		return acc;
    }, {});
    
function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
    const sessions = {};
    

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        var userToken = crypto.randomBytes(20).toString("hex");        // random key for this session
        var creationTime = Date.now();                  // Creation time of this session
        var user = {                                    // User object to store in sessions dictionary
            'username': username,
            'creationTime': creationTime,
            'expireTime': creationTime+maxAge
        };
        sessions[userToken] = user;                    // Store user session in sessions dictionary

        response.cookie('cpen400a-session', userToken, {maxAge: maxAge});   // Add cookie to reponse that contains userToken
        
        // Delete the session after specified maxAge time after creation
        setTimeout(function() {
            delete sessions[userToken];
        }, maxAge);
	};

	this.deleteSession = (request) => {

        console.log(" ====== Inside SessionManager deleteSession function ==============");
        console.log("the session token is");
        var sessionToken = request['session'];
        delete request['username'];               // Delete username from request
        delete request['session'];                // Delete session from request

        if(sessionToken in sessions)
            delete sessions[sessionToken];      // end the user session
    
	};

	this.middleware = (request, response, next) => {
        
        console.log(" ====== Inside SessionManager midleware function ==============");
        console.log("Cookies are");
        var cookies = request.headers['cookie'];
        console.log(cookies);

        if(!cookies || cookies == undefined) {
            next(new SessionError("There was no cookie in the request header."));
            return;
        }
        cookies = parseCookie(cookies);

        var sessionCookie = cookies['cpen400a-session'];    // Session token, format: cookie1=38rh23fuh; cookie2=ewuifhweif; cookie3=weifjewi
        console.log("The cookie is ", sessionCookie);
        var user = sessions[sessionCookie];             // Username associated with this session (if there is one)

        //console.log("The session token is ", sessionCookie);
        //console.log("The session user is ", user);
        if(user) { // Session exists in sessions array
            request['username'] = user['username'];
            request['session'] = sessionCookie;             // assign a property named session and set its value to the cookie value (the token)
            next();
        } else {
            next(new SessionError("This session does not exist."));
        }
        
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;