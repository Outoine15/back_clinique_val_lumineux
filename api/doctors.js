async function handle(method, splittedRoute, query) {
    res;
    switch(method) {
        case "GET":
            res = await handleGet(splittedRoute, query);
            break;
        case "POST":
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

async function handleGet(splittedRoute, query) {
    res = { statusCode: 302, location: '/404' };
    if(splittedRoute.length == 1) { // "/api/doctors/{doctor_id}"
        res = {
            statusCode: 200,
            contentType: "application/json",
            content: JSON.stringify(await getDoctor(splittedRoute[0], query))
        };
    }
    return res;
}

async function getDoctor(doctorID, query) {
    res = {}

    rows = await query(
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
        ORDER BY A.time_start`
    ).then((result) => {
        if(result.length != 0) {
            res = {
                "id": result[0]["doctor_id"],
                "name": result[0]["name"],
                "firstname": result[0]["firstname"],
                "sector": {
                    "id": result[0]["sector_id"],
                    "name": result[0]["sector_name"],
                    "description": result[0]["description"],
                    "job_name": result[0]["job_name"],
                    "color": result[0]["color"]
                },
                "appointments": []
            }
        } else {
            res = {
                success: false
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
    });

    return res;
}

module.exports = {
    handle: handle
}