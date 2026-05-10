const { createHash, randomBytes } = require('crypto');

async function handle(method, splittedRoute, headers, data, queryParameters, query) {
    var res = { statusCode: 302, location: '/404' };
    switch(method) {
        case "GET":
            res = await handleGet(splittedRoute, headers, data, query);
            break;
        case "PUT":
            res = await handlePut(splittedRoute, headers, data, query);
            break;
        case "DELETE":
            res = await handleDelete(splittedRoute, headers, data, query);
            break;
    } 
    return res;
}

async function handleGet(splittedRoute, headers, data, query) {
    var res = { statusCode: 302, location: '/404' };
    var content;

    if(splittedRoute.length == 1) { // "/api/doctors/{doctor_id}" ou "/api/doctors/appointments"
        if(splittedRoute[0] == "appointments") content = await getDoctorAppointments(headers, query);
        else content = await getDoctor(splittedRoute[0], query);
    } else if(splittedRoute.length == 0) {
        content = await getDoctors(query);
    }

    if(content) {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(content)
        };
    }

    return res;
}

async function getDoctorAppointments(headers, query) {
    var res = {success: false};

    if(headers["authorization"]) {
        var token = headers["authorization"].replace("Bearer ", "");

        var appointments = await query(`
            SELECT A.id as appointment_id, A.time_start, A.time_end, \
            C.id as client_id, C.name, C.firstname \
            FROM appointment A \
            LEFT OUTER JOIN client C \
            ON A.client_id = C.id \
            JOIN user U \
            ON A.doctor_id = U.doctor_id \
            JOIN user_token UT \
            ON U.id = UT.user \
            WHERE UT.token = "${token}"
        `);

        if(appointments.length != 0) {
            res = [];
            
            for(i = 0 ; i < appointments.length ; i++) {
                var appointment = appointments[i];

                var info = {
                    "id": appointment["appointment_id"],
                    "start": appointment["time_start"],
                    "end": appointment["time_end"],
                };

                if(appointment["client_id"] != null) {
                    info["client"] = {
                        "id": appointment["client_id"],
                        "name": appointment["name"],
                        "firstname": appointment["firstname"]
                    };
                } else info["client"] = null;

                res.push(info);
            }
        }
    }

    return res;
}

async function getDoctor(doctorID, query) {
    var res = {success: false};

    var result = await query(
        `SELECT \
        D.id as doctor_id, \
        D.name, \
        D.firstname, \
        S.id as sector_id, \
        S.name as sector_name, \
        S.description, \
        S.job as job_name, \
        S.color, \
        A.id as appointment_id, \
        A.time_start, \
        A.time_end, \
        A.client_id \
        FROM doctor D \
        JOIN sector S \
        ON D.sector_id = S.id \
        LEFT OUTER JOIN appointment A \
        ON D.id = A.doctor_id \
        WHERE D.id = ${doctorID} \
        AND A.time_end < NOW() \
        ORDER BY A.time_start`
    );
    
    var entry;
    if(result.length != 0) {
        entry = result[0];
        res = {
            "id": entry["doctor_id"],
            "name": entry["name"],
            "firstname": entry["firstname"],
            "sector": {
                "id": entry["sector_id"],
                "name": entry["sector_name"],
                "description": entry["description"],
                "job_name": entry["job_name"],
                "color": entry["color"]
            },
            "appointments": []
        }
    }

    for(i = 0 ; i < result.length ; i++) {
        entry = result[i];
        if(entry["appointment_id"] != null) {
            res["appointments"].push({ 
                "id": entry["appointment_id"],
                "start": entry["time_start"],
                "end": entry["time_end"],
                "reserved": entry["client_id"] != null
            });
        }
    }
        

    return res;
}

async function getDoctors(query) {
    var res = { success: false };

    var result = await query(`
        SELECT \
        D.id as doctor_id, D.name, D.firstname, \
        S.id as sector_id, S.name as sector_name, S.description, S.job as job_name, S.color, \
        A.id as appointment_id, A.time_start, A.time_end, A.client_id \
        FROM doctor D \
        JOIN sector S \
        ON D.sector_id = S.id \
        LEFT OUTER JOIN appointment A \
        ON D.id = A.doctor_id \
        WHERE NOW() < A.time_end \
        ORDER BY D.id
    `);
    
    res = [];
    var doctor;
    var doctorID;

    for(i = 0 ; i < result.length ; i++) {
        entry = result[i];
        if(doctorID != entry["doctor_id"]) {
            if(doctor) res.push(doctor);

            doctorID = entry["doctor_id"];
            doctor = {
                id: entry["doctor_id"],
                name: entry["name"],
                firstname: entry["firstname"],
                sector: {
                    id: entry["sector_id"],
                    name: entry["sector_name"],
                    description: entry["description"],
                    job_name: entry["job_name"],
                    color: entry["color"]
                },
                appointments: []
            }
        }

        if(entry["appointment_id"]) { // si il a une consultation (reservée ou non), on la marque
            doctor["appointments"].push({
                id: entry["appointment_id"],
                start: entry["time_start"],
                end: entry["time_end"],
                reserved: entry["client_id"] != null
            });
        }
    }

    if(doctor) res.push(doctor);

    return res;
}

async function handlePut(splittedRoute, headers, data, query) {
    var res = { statusCode: 302, location: '/404' };
    
    if(splittedRoute.length == 0) {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(await createDoctor(headers, data, query))
        }
    }
    return res;
}

async function createDoctor(headers, data, query) {
    var res = {success: false};

    if(headers["authorization"] && data["mail"] && data["name"] && data["firstname"] && data["sectorID"] && data["password"]) {
        var token = headers["authorization"].replace("Bearer ", "");

        var isAdmin = (await query(`
            SELECT U.id \
            FROM user U \
            JOIN user_token UT \
            ON U.id = UT.user \
            WHERE token = "${token}" \
            AND U.admin_id IS NOT NULL
        `));

        if(isAdmin) {
            var doctorID = (await query(`
                INSERT INTO doctor(name, firstname, sector_id) \
                VALUES ("${data["name"]}", "${data["firstname"]}", ${data["sectorID"]})
            `))["insertId"];

            var sectorInfo = (await query(`SELECT name, description, job, color FROM sector WHERE id = ${data["sectorID"]}`))[0];

            var userID = (await query(`
                INSERT INTO user(mail, password, doctor_id) \
                VALUES ("${data["mail"]}", "${createHash('md5').update(data["password"]).digest("base64")}", ${doctorID});
            `))["insertId"];

            var token = randomBytes(64).toString("base64url");

            await query(`
                INSERT INTO user_token \
                VALUES (${userID}, "${token}", DATE_ADD(NOW(), INTERVAL 1 WEEK)) 
            `);

            res = {
                "id": userID,
                "mail": data["mail"],
                "name": data["name"],
                "firstname": data["firstname"],
                "sector": {
                    "id": data["sectorID"],
                    "name": sectorInfo["name"],
                    "description": sectorInfo["description"],
                    "job": sectorInfo["job"],
                    "color": sectorInfo["color"]
                },
                "token": token
            };
        }
    }

    return res;
}

async function handleDelete(splittedRoute, headers, data, query) {
    var res = { statusCode: 302, location: '/404' };
    
    if(splittedRoute.length == 1) {
        res = {
            statusCode: 200,
            contentType: 'application/json',
            content: JSON.stringify(await deleteDoctor(headers, splittedRoute[0], query))
        };
    }
    return res;
}

async function deleteDoctor(headers, doctorID, query) {
    res = { success: false };

    if(headers["authorization"] && parseInt(doctorID) != NaN) {
        var token = headers["authorization"].replace("Bearer ", "");

        var isAdmin = (await query(`
            SELECT U.admin_id \
            FROM user U \
            JOIN user_token UT \
            ON U.id = UT.user \
            WHERE U.admin_id IS NOT NULL \
            AND UT.token = "${token}"
        `)).length == 1;
        
        if(isAdmin) {
            await query(`DELETE FROM doctor WHERE id = ${doctorID}`);
            res["success"] = true;
        }
    }

    return res;
}

module.exports = {
    handle: handle
}