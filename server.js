const https = require("https");
const fs = require("fs");
const key = fs.readFileSync("../../cert/CA/localhost/localhost.decrypted.key");
const cert = fs.readFileSync("../../cert/CA/localhost/localhost.crt");

const users = {
  user1: "pass1",
  user2: "pass2",
};

const session = {};

const setSession = function(res, userName) {
	//generate session id
	const sessionId = (Math.random() + 1).toString(36).substring(7);
	session[sessionId] = { [userName]: true };	
	//set cookie with session  id
	res.setHeader("Set-Cookie", [`session-id=${sessionId};max-age=300`]);
}

const getUserNameInSession = function(cookieHeader){
	//return session object with given session id
	const cookie = cookieHeader.split(`;`)[0];	
    let [name, sessionId, ...rest] = cookie.split(`=`);
	const user = session[sessionId];
	if(!user) { return null; }
	const userName = Object.keys(user)[0];
	return userName; 
}

const authenticateSession = function(cookieHeader) {
	const userName = getUserNameInSession(cookieHeader);
	if (!users[userName]) {
		console.log("I am not authenticated");
      return false;	  
    }
  
  //console.log("I am authenticated ")
  return true;
}

const homePage = function (res, path) {
	let data = "";
	if(path == "/")
	{
		data = fs.readFileSync("./static/index.html");
	}else {
		data = fs.readFileSync("./static" + path + "/index.html");
	}
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(data);
};

const homePageRedirection = function (res,userName) {  
	res.setHeader("Location", "/home");
		  setSession(res,userName);
  res.writeHead(303, { "Content-Type": "text/html" });  
};


const errorResponse = function (res) {
  res.setHeader("WWW-Authenticate", "Basic");
  res.writeHead(401, { "Content-Type": "text/html" });
  res.write("Error - user not authenticated! ");
};

const listener = function (req, res) {
  //console.log(req.url);
  

  try {
    const cookieHeader = req.headers?.cookie;

    if (req.url == "/login") {
      //console.log("inside login");

      let body = [];
      req
        .on("data", (chunk) => {
          body.push(chunk);
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          const data = body.split("&");
          let userName = "";
          let password = "";
          data.forEach((val) => {
            const inputData = val.split("=");
            if (inputData[0] == "name") {
              userName = inputData[1];
            }

            if (inputData[0] == "password") {
              password = inputData[1];
            }
          });

          if (!userName || !password || users[userName] != password) {
            console.log("login failure " + body);
            errorResponse(res);
            res.end();            
            return;
            
          }
          homePageRedirection(res, userName);
          console.log("login success ");
          res.end();
          return;
        });
    } else if (cookieHeader) {
      //console.log("got cookies " + cookieHeader);
      if (!authenticateSession(cookieHeader)) {
        console.log("authentication failure ");
        errorResponse(res);
        res.end();
		return;
      }
	  
	  if(req.url == '/home' || req.url == '/path' || req.url == '/'){
		  //console.log("inside " + req.url)
			homePage(res, req.url);
			res.end();
	  } else {
		const data = fs.readFileSync("./static" + req.url);
		res.writeHead(200, { "Content-Type": "text/html" });
		res.write(data);
		res.end();
	  }	  	  
    } else {
      //console.log("First time login");
      const data = fs.readFileSync("./static/login.html");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    }
	
  } catch (err) {
    res.write("Error " + err);
  }
};

const server = https.createServer({ key, cert }, listener);
server.listen(443);
