let http = require("http"),
    https = require("https");

/**
 * Not required. Replaced by axios ( due to no url support )
 */
exports.request = function (options) {
    const url = options.url;
    let reqHandler = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
        let req = reqHandler.get(url, (res) => {
            let output = '';
            console.log('rest::', url + ':' + res.statusCode);
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', () => {
                const result = {
                    status: res.statusCode,
                    headers: res.headers,
                    data: output
                };
                console.log(result);
                resolve(result);
            });
        });

        req.on('error', (err) => {
            console.error('rest::request', err);
            reject(err);
        });

        req.end();
    });
};