import express from "express";
import session from 'express-session';
import { Database, RequestError } from "./express/dao/database";
var MongoDBStore = require('connect-mongodb-session')(session);
const port = process.env.PORT || 3000;
const app = express();
// sql session
const options = {
    uri: Database.uri,
    databaseName: 'sessions',
    collection: 'sessions'
};
var sessionStore = new MongoDBStore(options);
sessionStore.on('error', (error) => {
    console.error(error);
});
app.set("trust proxy", true);
app.use(session({
    name: 'ticketing_sessionid',
    secret: 'sakdjfpaoisdfjpaosdijf',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: false, secure: false, sameSite: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
// angular front
app.use('/web', express.static('web/dist/ticketing/browser'));
app.use('/web/*', function (_, res) {
    const options = {
        root: 'web/dist/ticketing/browser'
    };
    const fileName = 'index.html';
    res.sendFile(fileName, options);
});
app.use('*', function (req, res, next) {
    res.locals.RequestErrorList = new Array();
    res.locals.session = Database.mongo.startSession();
    next();
});
app.use(express.json());
import { User } from './express/router/user';
app.use('/user', User.RouterFactory());
import { Event } from './express/router/event';
app.use('/event', Event.RouterFactory());
import { Seat } from './express/router/seat';
app.use('/seat', Seat.RouterFactory());
import { Venue } from './express/router/venue';
app.use('/venue', Venue.RouterFactory());
import { PriceTier } from './express/router/priceTier';
app.use('/priceTier', PriceTier.RouterFactory());
import { Ticket } from './express/router/ticket';
app.use('/ticket', Ticket.RouterFactory());
import { Admin } from './express/router/admin';
app.use('/admin', Admin.RouterFactory());
app.use('/*', function (_, res) {
    res.redirect("/web/");
});
app.use(async (output, req, res, next) => {
    try {
        if (output instanceof RequestError || res.locals.RequestErrorList.length != 0) {
            if (res.locals.session.inTransaction()) {
                console.log("abort");
                await res.locals.session.abortTransaction();
            }
            else {
            }
            if (output instanceof RequestError) {
                res.locals.RequestErrorList.push(output);
            }
            res.status(400).json({ success: false, reasons: res.locals.RequestErrorList.map((err) => err.message) });
        }
        else {
            if (res.locals.session.inTransaction()) {
                await res.locals.session.commitTransaction();
                res.json(output);
            }
            else {
                res.json(output);
            }
        }
        res.locals.session.endSession();
    }
    catch (err) {
        console.log(err);
    }
    finally {
        next();
    }
});
await Database.init().then(_ => {
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
});
app.listen(port, async () => { console.log("Server ready!"); });
module.exports = app;
