const https = require('https');
const fs = require('fs');
const key = fs.readFileSync('../../cert/CA/localhost/localhost.decrypted.key'); 
const cert = fs.readFileSync('../../cert/CA/localhost/localhost.crt');


const users = {
  user1: "drrrrrrr",
  user2: "hyijjtrkl"
}


const listener = function (req,res){
console.log(req.url);
res.writeHead(200, {'Content-Type': 'text/html'});

try{
	const data = fs.readFileSync('./static/index.html');
	res.write(data);	
}
catch(err){
	res.write('Error ' + err);
}

  
  res.end();
}

const server = https.createServer({key,cert},listener);
server.listen(443);