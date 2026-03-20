async function handle(method, splittedRoute, headers, data, queryParameters, query) {
    var res = { statusCode: 302, location: '/404' };
    switch(method) {
        case "GET":
            res = await handleGet(splittedRoute, headers, data, query);
    }
    return res;
}

async function handleGet(splittedRoute, headers, data, query) { // /clients/...
    var res = { statusCode: 302, location: '/404' };
    
    if(splittedRoute.length == 0) {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(await getClients(headers, query))
        }
    }

    return res;
}

async function getClients(headers, query) {
    var res = {};

    if(headers["authorization"]) {
        var token = headers["authorization"].replace("Bearer ", "");
        res = await query(`
            SELECT C.id, C.name, C.firstname, C.birthdate \
            FROM client C \
            JOIN user_client UC \
            ON C.id=UC.client_id \
            JOIN user U \
            ON UC.user_id=U.id \
            JOIN user_token UT \
            ON U.id=UT.user \
            WHERE UT.token="${token}"
        `);
    }

    return res;
}

module.exports = {
    handle: handle
}