const https = require("https");
const fs = require("fs");
const key = fs.readFileSync("../../cert/CA/localhost/localhost.decrypted.key");
const cert = fs.readFileSync("../../cert/CA/localhost/localhost.crt");

const users = {
  user1: "pass1",
  user2: "pass2",
};

const authenticate = function (cookieHeader, res) {
  cookieHeader.split(`;`).forEach(function (cookie) {
    let [name, ...rest] = cookie.split(`=`);
    const user = JSON.parse(rest[0]);
    const userName = Object.keys(user)[0];
    if (!users[userName]) {
      return false;
    }
  });
  return true;
};

const homePage = function (res) {
  const data = fs.readFileSync("./static/index.html");
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(data);
};

const homePageRedirection = function (res) {  
	res.setHeader("Location", "/home");
		  res.setHeader("Set-Cookie", [`user={"${userName}":true};max-age=20`]);
  res.writeHead(303, { "Content-Type": "text/html" });  
};


const errorResponse = function (res) {
  res.setHeader("WWW-Authenticate", "Basic");
  res.writeHead(401, { "Content-Type": "text/html" });
  res.write("Error - user not authenticated! ");
};

const listener = function (req, res) {
  console.log(req.url);
  

const paths = ['login', 'home', "/" ];
const extensions = ['js','css','svg','ico'];
const extension = req.url.split('.').pop();


  try {
    const cookieHeader = req.headers?.cookie;

    if (req.url == "/login") {
      console.log("inside login");

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
    } else if(extensions.includes(extension)) {
		const data = fs.readFileSync("./static" + req.url);
		res.writeHead(200, { "Content-Type": "text/html" });
		res.write(data);
		res.end();	  
	} else if (cookieHeader) {
      console.log("cookies sent " + cookieHeader);
      if (!authenticate(cookieHeader)) {
        console.log("authentication failure ");
        res.write("Error - user not authenticated! ");
        res.setHeader("WWW-Authenticate", "Basic");
        res.writeHead(401, { "Content-Type": "text/html" });
        res.end();
        return;
      }
      homePage();
    } else if(paths.includes(req.url)) {
      console.log("First time login");
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
