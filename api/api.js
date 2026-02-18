const mysql = require('mysql');
const util = require('util');

const env = process.env;

const db = mysql.createConnection({
    host: env.DB_URL,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME 
});

const query = util.promisify(db.query).bind(db);

async function handleRequest(req) {
    res = { statusCode: 302, location: '/500'};

    connectionFailed = false;
    await util.promisify(db.connect).bind(db)()
        .catch(() => connectionFailed = true);

    if(!connectionFailed) {
        l = await query("SELECT * FROM sector");
        res = {
            statusCode: 200,
            contentType: "text/html",
            content: "<p>" + l + "</p>"
        };
    }
    return res;
}

module.exports = {
    handleRequest: handleRequest
};