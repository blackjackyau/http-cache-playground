const express = require('express');
const cfg = require('./config');
const cors = require('cors');
const preconditions = require('express-preconditions')

module.exports = () => {

    const app = express();
    const router = express.Router();

    const corsOptions = {
        origin: (origin, callback) => {
            callback(null, true);
        },
        credentials: true,
    };

    app.use(cors(corsOptions));
    app.use(preconditions());
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
        res.setHeader('cache-control', 'public, max-age=1');
        res.status(200).json({
            "name": "lalaking",
            "age": 10
        })
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