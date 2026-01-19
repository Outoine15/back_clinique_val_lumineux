const { createHash, timingSafeEqual, createHmac } = require('crypto');
const fs = require('fs');
const decompress = require("decompress");

const env = process.env;

const SITE_FOLDER = env.SITE_FOLDER;

const minimalGitRequestHeaders = [
    "x-github-delivery", "x-github-event", "x-github-hook-id", "x-github-hook-installation-target-id", "x-github-hook-installation-target-type"
];

async function handleRequest(req) { // headers: dictionnaire ; contentString: string
    var res = { statusCode: 200, contentType: 'text/plain' };
    
    var headers = req.headersDistinct;
    var allHeaders = true;
    var i = 0;
    while(allHeaders && i < minimalGitRequestHeaders.length) {
        allHeaders = headers[ minimalGitRequestHeaders[i] ] != undefined;
        i++;
    }

    var contentString;
    var contentJSON;
    
    try {
        contentString = await getData(req);
        contentJSON = JSON.parse(contentString);
    } catch (error) {}

    if(allHeaders &&
        headers["x-github-hook-installation-target-type"] == "repository" &&
        headers["x-github-event"] == "release" &&
        contentJSON != undefined
    ) { // mise à jour Front
        var validSender = true;

        if(env.GITHUB_FRONT_SECRET != undefined) {
            validSender = timingSafeEqual( // vérification via HMAC-SHA256 de l'authenticité du WebHook
                Buffer.from( ("" + headers["x-hub-signature-256"]).replace("sha256=", "") ),
                Buffer.from( createHmac('sha256', env.GITHUB_FRONT_SECRET).update(contentString).digest("hex") )
            );
        }

        if(validSender && contentJSON["action"] == "released") {
            const downloadURL = contentJSON["release"]["assets"][0]["browser_download_url"];
            const ZIP = SITE_FOLDER + ".zip";
            await downloadFile(downloadURL, ZIP);
            if(fs.existsSync(SITE_FOLDER)) {
                fs.rmSync(SITE_FOLDER, {recursive: true, force: true});
            }
            decompress(ZIP, SITE_FOLDER).then(() => {
                fs.rmSync(ZIP);
            }).catch((error) => console.log(error));
        }
    } else {
        if(headers["x-github-event"] != "ping") {
            res = { statusCode: 302, location: '/404' };
        }
    }
    return res;
}

async function downloadFile(from, to) {
    try {
        await fetch(from).then(async (r) => {
            fs.writeFileSync(to, Buffer.from(await r.arrayBuffer()));
        });
    }catch(error) { }
}

async function getData(req) {
    var res = undefined;
    req.setEncoding('utf-8');
    await req.on('readable', async () => {
        var content = req.read();
        if(content != null) {
            res = content;
        }
    });
    return res;
}

module.exports = {
    handleRequest: handleRequest   
}