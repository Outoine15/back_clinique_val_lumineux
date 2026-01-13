require("dotenv").config();

const http = require('http');
const env = process.env;

const hostname = env.SERVER_IP;
const port = env.SERVER_PORT;

const server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html');

	res.write("<html><body>")

	res.write("<h1>Welcome</h1>");
	res.write("<p>Hello World !</p>")

	res.end("</body></html>");
});

server.listen(port, hostname, () => {
	console.log(`Serveur démarré sur http://${hostname}:${port}`);
});