const env = process.env;

const minimalGitRequestHeaders = [
    "HTTP_USER_AGENT", "HTTP_X_GITHUB_HOOK_ID", "HTTP_X_GITHUB_EVENT", "HTTP_X_GITHUB_DELIVERY", "HTTP_X_GITHUB_HOOK_INSTALLATION_TARGET_TYPE"
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

    var contentJSON;
    
    try {
        contentJSON = JSON.parse(await getData(req));
    } catch (error) {}

    if(allHeaders &&
        headers["HTTP_USER_AGENT"].startsWith("GitHub-Hookshot/") &&
        headers["HTTP_X_GITHUB_HOOK_INSTALLATION_TARGET_TYPE"] == "repository" &&
        contentJSON != undefined
    ) {
        // TODO
        console.log(contentJSON)
    } else {
        res = { statusCode: 302, location: '/404' };
    }
    return res;
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