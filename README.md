# Technical stack
node.js v20.11.1
## front end
  - angular v18
  - angular material v18
  - photoswipe v4.1.6
## backend
  - express v4.18.3
  - mongoose v8.5.2

# Project structure
- angular project: `./web`
- backend: `./server`
- build: `./api`
#CICD
## Deployment step
1. Run `npm install` in both `./` and `./web`
2. Run `npm run build` in `./`
### Vercel support
Vercel is the primarily supported deployment platfrom. A script ,`vercel.js`, would output a correct vercel project configuration `vercel.json` for correct verson config and routes that serve the angular frontend SPA as static files. This script is executed with command `npm run build` and `npm start`.

Make sure up-to-date `vercel.json` is also pushed to the vercel deployment branch, because although a new `vercel.json` is created when vercel is running `npm run build`, only `vercel.json` that are loaded before build step are accepted by vercel ([see this GitHub discussion](https://github.com/vercel/vercel/discussions/8137)).

## Development
### Local development
1. Prepare a mongodb server.
2. Populate `./credential/.env`, an example is given at `./example.env`.
   
# Tools
## General admin tools
### Batch user creations
  1. prepare a javascript that exports user info as a variable `usersInSingingPart` in location `../credential/userList.js`.
  2. run `node ./tools/user.js --N Suffix`.
    - N: length of password in random numbers.
    - Suffix: a identifier append at the end of user login.
  3. The output could be found at `./credential/users${suffix}.json`.
  4. Import json records with tools such as [MongoDB Compass](https://www.mongodb.com/products/tools/compass).
## DB manipulation
### V0 to V1 schema migration
A custom DAO is developed at earily phase of development before any formal schema-enabled ODM is ever adopted.

For mingrating data generated from this version 0 to the V1 mongoose schema:
1. Update environment varialbe in `./credential/.env` and point the mongodb url to the target backend (e.g. Local / Mongodb Atlas).
2. Run `node --env-file ./credential/.env ./api/mongoose-schema/v1/migration.js`.
### Venue cloning 
1. Update environment varialbe in `./credential/.env` and point the mongodb url to the target backend (e.g. Local / Mongodb Atlas).
2. Update varialbe in `./mongoose-schema/v1/tools/clone_venue.ts` such that the script clone the correct venue and venue's section.
3. Transpile typescript.
4. Run `node --env-file ./credential/.env ./api/mongoose-schema/v1/tools/clone_venue.js`.
  
