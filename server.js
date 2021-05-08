const express = require('express');
const cfg = require('./config');
const cors = require('cors');
const preconditions = require('express-preconditions');
const axios = require('axios');
const httpClient = require('./http-client')

module.exports = () => {

    const app = express();
    const router = express.Router();

    const corsOptions = {
        origin: (origin, callback) => {
            callback(null, true);
        },
        credentials: true,
        maxAge: 3600,
    };

    app.use(cors(corsOptions));
    //app.use(preconditions());
    app.use(express.json())

    app.use('/api', router);

    app.use(express.static("docs"));

    app.use((request, response, next) => {

        const requestStart = Date.now();

        let errorMessage = null;
        let body = [];
        request.on("data", chunk => {
            body.push(chunk);
        });
        request.on("end", () => {
            body = Buffer.concat(body).toString();
        });
        request.on("error", error => {
            errorMessage = error.message;
        });

        response.on("finish", () => {
            const { rawHeaders, httpVersion, method, socket, url } = request;
            const { remoteAddress, remoteFamily } = socket;

            const { statusCode, statusMessage } = response;
            const headers = response.getHeaders();

            console.log({
                timestamp: Date.now(),
                processingTime: Date.now() - requestStart,
                rawHeaders,
                body,
                errorMessage,
                httpVersion,
                method,
                remoteAddress,
                remoteFamily,
                url,
                response: {
                    statusCode,
                    statusMessage,
                    headers
                }
            }
            );
        });

        next();
    });

    router.get('/user', (req, res) => {
        const ttl = 1000;
        res.setHeader('cache-control', `public, max-age=${ttl}`);
        res.setHeader('Vary', "accept-language");
        res.setHeader('expires', new Date(Date.now() + ( ttl * 1000 )).toUTCString(),);
        res.status(200).json({
            "name": "lalaking",
            "age": 10,
            "lang": req.headers["accept-language"]
        })
    });

    const reservedHeaders = ["content-length", "connection", "host"];

    router.get('/proxy/:url(*)', (req, res, next) => {
        const headers = Object.assign({}, req.headers);
        for (let rheader of reservedHeaders) {
            delete headers[rheader]
        }
        console.log(headers);
        axios.get(req.params.url, {headers}).then(resp => {

            for (const headerKey of Object.keys(resp.headers)) {
                res.setHeader(headerKey, resp.headers[headerKey]);
            }

            const upstreamInfo = { status: resp.status, headers: resp.headers }
            res.setHeader("x-upstream-info", JSON.stringify(upstreamInfo));

            res
                .status(resp.status)
                .send(resp.data);
        }).catch(error => {
            if (error.response) {
                const resp = error.response;
                for (const headerKey of Object.keys(resp.headers)) {
                    res.setHeader(headerKey, resp.headers[headerKey]);
                }
                const upstreamInfo = { status: resp.status, headers: resp.headers }
                res.setHeader("x-upstream-info", JSON.stringify(upstreamInfo));
    
                res
                    .status(resp.status)
                    .send(resp.data);
            } else {
                next(error);
            }
        });
    });

    const store = {};

    router.get('/etag-resources/:id', (req, res) => {
        let resource = store[req.params.id];
        if (!resource) return res.status(404).end();
        res
            .status(200)
            .set('ETag', '"' + resource.version + '"')
            .set('Last-Modified', resource.lastModified)
            .send(resource.data)
            .end();
    });

    router.post('/etag-resources/:id', (req, res) => {
        if (store[req.params.id]) return res.status(409).end();

        let resource = {
            version: 1,
            lastModified: new Date().toUTCString(),
            data: req.body
        };
        store[req.params.id] = resource;
        res
            .status(200)
            .location(req.path)
            .set('ETag', '"' + resource.version + '"')
            .set('Last-Modified', resource.lastModified)
            .send(resource.data)
            .end();
    });

    router.put('/etag-resources/:id', (req, res) => {
        let resource = store[req.params.id];
        if (!resource) return res.status(404).end();

        resource.version += 1;
        resource.lastModified = new Date().toUTCString();
        resource.data = req.body;
        res
            .status(200)
            .location(req.path)
            .set('ETag', '"' + resource.version + '"')
            .set('Last-Modified', resource.lastModified)
            .end();
    });


    app.listen(cfg.PORT, () => {
        console.log(`Backend server is running at port:${cfg.PORT}`);
    });

}