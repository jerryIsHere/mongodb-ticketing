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
var root = "./web/dist/ticketing/browser/"
const {
    relative,
    resolve
} = require('path');
const {
    readdir,
    writeFile
} = require('fs').promises;

async function getFiles(dir) {
        const dirents = await readdir(dir, {
            withFileTypes: true
        });
        const files = await Promise.all(dirents.map((dirent) => {
            const res = resolve(dir, dirent.name);
            return dirent.isDirectory() ? getFiles(res) : relative(root, res).replace('\\',"/");
        }));
        return Array.prototype.concat(...files);
    }
    (async () => {
        var files = await getFiles(root)
        vercel.routes = [...files.map(f => {
            return {
                "src": "/web/" + encodeURIComponent(f).replace("%2F",'/'),
                "dest": "/web/dist/ticketing/browser/" + f
            }
        }), ...vercel.routes]
        console.log("vercel.json for: \n", files)
        writeFile('vercel.json',
            JSON.stringify(vercel), 'utf8', () => {});
    })();