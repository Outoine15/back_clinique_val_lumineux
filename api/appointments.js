async function handle(method, splittedRoute, headers, data, queryParameters, query) {
    var res = { statusCode: 302, location: '/404' };
    switch(method) {
        case "PUT":
            res = await handlePut(splittedRoute, headers, data, query);
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
                result = result[0];
                await query(`
                    INSERT INTO appointment
                    (time_start, time_end, doctor_id)
                    VALUES 
                    ('${data["time_start"]}', '${data["time_end"]}', ${result["doctor_id"]})
                `).then(r => {
                    res = {
                        "id": r["insertId"],
                        "start": data["time_start"],
                        "end": data["time_end"],
                        "reseved": false,
                        "doctor": {
                            "id": result["doctor_id"],
                            "name": result["doctor_name"],
                            "firstname": result["doctor_firstname"]
                        },
                        "sector": {
                            "id": result["sector_id"],
                            "name": result["sector_name"],
                            "description": result["sector_description"],
                            "color": result["sector_color"]
                        }
                   }
                }).catch(() => res = "Erreur");
            } else res = "Requête interdite";
        });
    }

    return res;
}

module.exports = {
    handle: handle
}