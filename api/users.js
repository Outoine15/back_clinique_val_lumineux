const { createHash, randomBytes } = require('crypto');

async function handle(method, splittedRoute, data, query) {
    res;
    switch(method) {
        case "GET":
            //res = await handleGet(splittedRoute, data, query);
            break;
        case "POST":
            res = await handlePost(splittedRoute, data, query);
            break;
        case "PUT":
            break;
        case "DELETE":
            break;
        default:
            res = { statusCode: 302, location: '/404' };
            break;
    }
    return res;
}

async function handlePost(splittedRoute, data, query) {
    res = { statusCode: 302, location: '/404' };
    if(splittedRoute.length == 0) {
        res = {
            statusCode: 200,
            contentType: "application/json",
            content: JSON.stringify(await connectMailPassword(data, query))
        };
    }

    return res;
}

async function connectMailPassword(data, query) {
    res = {"success": false};

    if(data["mail"] && data["password"]) {
        await query(
            `SELECT
            U.id, U.mail, \
            C.name as client_name, \
            C.firstname as client_firstname, \
            A.name as admin_name, A.firstname as admin_firstname, \
            S.name as secretary_name, S.firstname as secretary_firstname, \
            D.name as doctor_name, D.firstname as doctor_firstname \
            FROM user U \
            LEFT OUTER JOIN user_client UC \
            ON UC.user_id = U.id \
            LEFT OUTER JOIN client C \
            ON UC.client_id = C.id \
            LEFT OUTER JOIN admin A \
            ON (U.admin_id IS NOT NULL AND U.admin_id = A.id) \
            LEFT OUTER JOIN secretary S \
            ON (U.secretary_id IS NOT NULL AND U.secretary_id = S.id) \
            LEFT OUTER JOIN doctor D \
            ON (U.doctor_id IS NOT NULL AND U.doctor_id = D.id) \
            WHERE U.mail='${data["mail"]}' AND U.password='${createHash('md5').update(data["password"]).digest("base64")}'`
        ).then(async (result) => {
            if(result.length == 1) { // le seul cas de succès
                user = result[0];
                token = randomBytes(64).toString("base64url");
                res = {
                    "id": user["id"],
                    "mail": user["mail"],
                    "name": user["client_name"] || user["admin_name"] || user["secretary_name"] || user["admin_name"],
                    "firstname": user["client_firstname"] || user["admin_firstname"] || user["secretary_firstname"] || user["admin_firstname"],
                    "admin": user["admin_firstname"] != null,
                    "secretary": user["secretary_firstname"] != null,
                    "doctor": user["doctor_firstname"] != null,
                    "token": token
                };

                await query(`INSERT INTO user_token VALUES (${user["id"]}, '${token}')`);
            }
        });
    }

    return res;
}

module.exports = {
    handle: handle
}