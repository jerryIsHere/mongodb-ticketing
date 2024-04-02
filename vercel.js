var vercel = {
    "version": 2,
    "builds": [{
            "src": "/api/index.js",
            "use": "@vercel/node"
        },
        {
            "src": "web/dist/ticketing/browser/**",
            "use": "@vercel/static"
        }
    ],
    "routes": [{
            "src": "/web/(.*)",
            "dest": "/web/dist/ticketing/browser/index.html"
        },
        {
            "src": "/(.*)",
            "dest": "/api/index.js"
        }
    ]
}
var path = "/web/dist/ticketing/browser/"
var files = []
const fs = require('fs');
fs.readdir(`.${path}`, (err, fileIter) => {
    fileIter.forEach(file => {
        files.push(file)
    });
    vercel.routes = [...files.map(f => {
        return {
            "src": "/web/(.*)",
            "dest": "/web/dist/ticketing/browser/" + f
        }
    }), ...vercel.routes]
    fs.writeFile('vercel.json',
        JSON.stringify(vercel), 'utf8', () => {});
});