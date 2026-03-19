async function handle(method, splittedRoute, headers, data, queryParameters, query) {
    var res = { statusCode: 302, location: '/404' };
    switch(method) {
        case "PUT":
            res = await handlePut(splittedRoute, headers, data, query);
        case "DELETE":
            res = await handleDelete(splittedRoute, headers, data, query);
    }
    return res;
}

async function handlePut(splittedRoute, headers, data, query) {
    var res = { statusCode: 302, location: '/404' };
    if(splittedRoute.length == 0) {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(await createAppointments(headers, data, query))
        };
    } else if(splittedRoute.length == 2 && splittedRoute[1] == "subscribe") {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(await subscribeAppointments(headers, data, splittedRoute[0], query))
        }
    }
    return res;
}

async function createAppointments(headers, data, query) { // création d'un rendez-vous de la part d'un docteur connecté
    var res = {}; 

    if(headers["authorization"] && data["time_start"] && data["time_end"]) {
        var token = headers["authorization"].replace("Bearer ", "");
        await query(`
            SELECT D.id as doctor_id, D.name as doctor_name, D.firstname as doctor_firstname, \
            S.id as sector_id, S.name as sector_name, S.description as sector_description, S.color as sector_color \
            FROM user U \
            JOIN user_token UT \
            ON U.id = UT.user \
            JOIN doctor D \
            ON U.doctor_id = D.id \
            JOIN sector S \
            ON D.sector_id = S.id \
            WHERE UT.token="${token}"
        `).then(async (result) => {
            if(result.length == 1) {
                var dataSet = result[0];
                await query(`
                    INSERT INTO appointment
                    (time_start, time_end, doctor_id)
                    VALUES 
                    ('${data["time_start"]}', '${data["time_end"]}', ${dataSet["doctor_id"]})
                `).then(r => {
                    res = {
                        "id": r["insertId"],
                        "start": data["time_start"],
                        "end": data["time_end"],
                        "reseved": false,
                        "doctor": {
                            "id": dataSet["doctor_id"],
                            "name": dataSet["doctor_name"],
                            "firstname": dataSet["doctor_firstname"]
                        },
                        "sector": {
                            "id": dataSet["sector_id"],
                            "name": dataSet["sector_name"],
                            "description": dataSet["sector_description"],
                            "color": dataSet["sector_color"]
                        }
                   }
                }).catch(() => res = "Erreur");
            } else res = "Requête interdite";
        });
    }

    return res;
}

async function subscribeAppointments(headers, data, appointmentID, query) {
    var res = {};

    if(headers["authorization"] && data["client_id"]) {
        var token = headers["authorization"].replace("Bearer ", "");
        var clientID = data["client_id"];
        await query(`
            SELECT U.id as user_id, A.id as appointment_id \
            FROM user U \
            JOIN user_client UC \
            ON U.id=UC.user_id \
            JOIN user_token UT \
            ON U.id=UT.user \
            LEFT OUTER JOIN appointment A \
            ON A.id=${appointmentID} \
            WHERE UC.client_id=${clientID} \
            AND UT.token="${token}" \
            AND A.client_id IS NULL
        `).then(async result => {
            if(result.length == 1) { // le client est bien lié à l'utilisateur
                if(result[0]["appointment_id"] == appointmentID) {
                    await query(`
                        UPDATE appointment A SET client_id=${clientID} WHERE A.id=${appointmentID}
                    `).then(() => {
                        // on a ajouté le rendez-vous au client
                        res["success"] = true;
                    }).catch(() => res = "Erreur UPDATE");
                } else res = "Déjà réservé";
            } else res = "Action interdite";
        }).catch(() => res = "Erreur SELECT");
    }

    return res;
}

async function handleDelete(splittedRoute, headers, data, query) {
    var res = { statusCode: 302, location: '/404' };
    if(splittedRoute.length == 2 && splittedRoute[1] == "unsubscribe") {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(await unsubscribeAppointments(headers, splittedRoute[0], query))
        }
    }
    return res;
}

async function unsubscribeAppointments(headers, appointmentID, query) {
    var res = {};
    if(headers["authorization"]) {
        var token = headers["authorization"].replace("Bearer ", "");
        await query(`
            SELECT A.client_id \
            FROM appointment A \
            JOIN client C \
            ON A.client_id=C.id \
            JOIN user_client UC \
            ON C.id=UC.client_id \
            JOIN user_token UT \
            ON UC.user_id=UT.user \
            WHERE A.id=${appointmentID} \
            AND UT.token="${token}"
        `).then(async result => {
            if(result.length == 1) {
                await query(`
                    UPDATE appointment SET client_id=NULL WHERE client_id=${result[0]["client_id"]}
                `).then(() => {
                    res["success"] = true;
                })
            } else res = "Erreur 1";
        });
    }
    return res;
}

module.exports = {
    handle: handle
}