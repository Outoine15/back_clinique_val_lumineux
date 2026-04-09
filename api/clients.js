async function handle(method, splittedRoute, headers, data, queryParameters, query) {
    var res = { statusCode: 302, location: '/404' };
    switch(method) {
        case "GET":
            res = await handleGet(splittedRoute, headers, data, query);
            break;
        case "PUT":
            res = await handlePut(splittedRoute, headers, data, query);
            break;

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

async function handlePut(splittedRoute, headers, data, query) {
    var res = { statusCode: 302, location: '/404' };
    
    if(splittedRoute.length == 0) {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(await attachClient(headers, data, query))
        }
    }

    return res;
}

async function attachClient(headers, data, query) {
    var res = {"success": false};
    if(headers["authorization"] && data["client_code"]) {
        var token = headers["authorization"].replace("Bearer ", "");
        var clientCode = data["client_code"];
        var clientCodeId = clientCode.slice(2).slice(0, -2);

        if(parseInt(clientCodeId)) {
            var userAndClientRes = await query(`
                SELECT U.id as user_id, C.name as client_name, C.firstname as client_firstname, C.birthdate as client_birthdate \
                FROM user U \
                JOIN user_token UT \
                ON U.id = UT.user \
                LEFT OUTER JOIN client C \
                ON C.id=${clientCodeId} \
                WHERE UT.token="${token}"
            `);
    
            if(userAndClientRes.length == 1 && userAndClientRes[0]["client_name"]) { // s'il y a bien un utilisateur avec ce token et un client avec cet ID
                var userAndClient = userAndClientRes[0];
                var expectedCode = userAndClient["client_name"].slice(0,2) + clientCodeId + userAndClient["client_firstname"].slice(0,2);
                if(clientCode == expectedCode) { // le code est bon
                    await query(`
                        INSERT INTO user_client VALUES (${clientCodeId}, ${userAndClient["user_id"]})
                    `).then(() => {
                        res["success"] = true;
                        res["client"] = {
                            "id": clientCodeId,
                            "name": userAndClient["client_name"],
                            "firstname": userAndClient["client_firstname"],
                            "birthdate": userAndClient["client_birthdate"]
                        }
                    }).catch(() => res["reason"] = "Client déjà lié à l'utilisateur");
                } else { res["reason"] = "Code incorrect"; }
            } else { res["reason"] = "Informations invalides"; }
        } else { res["reason"] = "Code invalide"; }
    }

    return res;
}

module.exports = {
    handle: handle
}