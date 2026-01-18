const { createHash, timingSafeEqual, createHmac } = require('crypto');
const fs = require('fs');
const decompress = require("decompress");

const env = process.env;

const SITE_FOLDER = env.SITE_FOLDER;

const minimalGitRequestHeaders = [
    "HTTP_USER_AGENT", "HTTP_X_GITHUB_HOOK_ID", "HTTP_X_GITHUB_EVENT", "HTTP_X_GITHUB_DELIVERY", "HTTP_X_GITHUB_HOOK_INSTALLATION_TARGET_TYPE",
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
        headers["HTTP_USER_AGENT"].startsWith("GitHub-Hookshot/") &&
        headers["HTTP_X_GITHUB_HOOK_INSTALLATION_TARGET_TYPE"] == "repository" &&
        headers["HTTP_X_GITHUB_EVENT"] == "release" &&
        contentJSON != undefined
    ) { // mise à jour Front
        var validSender = true;

        if(env.GITHUB_FRONT_SECRET != undefined) {
            validSender = timingSafeEqual( // vérification via HMAC-SHA256 de l'authenticité du WebHook
                headers["X-HUB-SIGNATURE-256"].replace("sha256=", ""),
                createHmac('sha256', env.GITHUB_FRONT_SECRET).update(contentString).digest("hex")
            );
        }

        if(validSender) {
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
        res = { statusCode: 302, location: '/404' };
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