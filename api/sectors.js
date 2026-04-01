async function handle(method, splittedRoute, headers, data, queryParameters, query) {
    var res = { statusCode: 302, location: '/404' };
    switch(method) {
        case "GET":
            res = await handleGet(splittedRoute, headers, data, query);
            break;
        case "DELETE":
            break;
    }
    return res;
}


async function handleGet(splittedRoute, headers, data, query) {
    var res = { statusCode: 302, location: '/404' };
    var content;

    if(splittedRoute.length == 1) { // "/api/sectors/{sectors_id}"
        content = await getSector(splittedRoute[0], query);
    } else if(splittedRoute.length == 0) {
        content = await getSectors(query);
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


async function getSector(sectorID, query) {
    var res = {success: false};
    var result = await query(
        `SELECT \
        id , \
        name, \
        description, \
        job, \
        color \
        FROM sector \
        WHERE id = ${sectorID}
        `
    );

    var entry;
    if(result.length != 0) {
        entry = result[0];
        res = {
            "id": entry["sector_id"],
            "name": entry["sector_name"],
            "description": entry["description"],
            "job_name": entry["job_name"],
            "color": entry["color"]
        }
    }
    return res;
}

async function getSectors(query) {
    var res = [];

    var result = await query(
        `SELECT \
        S.id as sector_id, S.name as sector_name, S.description, S.job as job_name, S.color, \
        D.id as doctor_id, D.name as doctor_name, D.firstname, \
        A.id as appointment_id, A.time_start, A.time_end, A.client_id \
        FROM sector S \
        LEFT OUTER JOIN doctor D ON D.sector_id = S.id \
        LEFT OUTER JOIN appointment A ON D.id = A.doctor_id \
        ORDER BY S.id, D.id`
    );

    let entry;  
    let sectorID;
    let doctorID;
    let sector;
    let doctor;

    for(let i = 0 ; i < result.length ; i++){
        entry = result[i];

        //on vérifie que c'est bien un nouveau secteur
        if(sectorID != entry["sector_id"]) {
            //on envoie nos données avant de les écraser si elle existes.
            if(doctor){
                sector.doctors.push(doctor);
            }
            if(sector){
                res.push(sector);
            }
            //on actualise le nouveau secteur
            sectorID =entry["sector_id"];
            sector = {
                "id": entry["sector_id"],
                "name": entry["sector_name"],
                "description": entry["description"],
                "job": entry["job_name"],
                "color": entry["color"],
                "doctors" : []
            };
        };

        //on vérifie que il existe bien un docteur et qu'il est différent ce celui "actuel"
        if(entry["doctor_id"] && doctorID != entry["doctor_id"]){
            doctorID = entry["doctor_id"];
            doctor = {
                "id": entry["doctor_id"],
                "name": entry["doctor_name"],
                "firstname": entry["firstname"],
                "appointments": []
            };
        };

        //on vérifie que le docteut existe et aussi le rdv
        if(entry["appointment_id"] && doctor) {
            //on ajoute le rdv a la liste du docteur en question
            doctor.appointments.push({ 
                "id": entry["appointment_id"],
                "start": entry["time_start"],
                "end": entry["time_end"],
                "reserved": entry["client_id"] != null
            });
        }
    }

    if(doctor){
        sector.doctors.push(doctor);
    } 
    if(sector){
        res.push(sector);
    }

    console.log(res);
    return res;
}

module.exports = {
    handle: handle
}

