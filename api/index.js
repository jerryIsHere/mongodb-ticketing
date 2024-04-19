"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const database_1 = require("./express/dao/database");
var MongoDBStore = require('connect-mongodb-session')(express_session_1.default);
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
// sql session
const options = {
    uri: database_1.Database.uri,
    databaseName: 'sessions',
    collection: 'sessions'
};
var sessionStore = new MongoDBStore(options);
sessionStore.on('error', (error) => {
    console.error(error);
});
app.set("trust proxy", true);
app.use((0, express_session_1.default)({
    name: 'ticketing_sessionid',
    secret: 'sakdjfpaoisdfjpaosdijf',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: false, secure: false, sameSite: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
// angular front
app.use('/web', express_1.default.static('web/dist/ticketing/browser'));
app.use('/web/*', function (_, res) {
    const options = {
        root: 'web/dist/ticketing/browser'
    };
    const fileName = 'index.html';
    res.sendFile(fileName, options);
});
app.use('*', function (req, res, next) {
    res.locals.RequestErrorList = new Array();
    res.locals.session = database_1.Database.mongo.startSession();
    next();
});
app.use(express_1.default.json());
const user_1 = require("./express/router/user");
app.use('/user', user_1.User.RouterFactory());
const event_1 = require("./express/router/event");
app.use('/event', event_1.Event.RouterFactory());
const seat_1 = require("./express/router/seat");
app.use('/seat', seat_1.Seat.RouterFactory());
const venue_1 = require("./express/router/venue");
app.use('/venue', venue_1.Venue.RouterFactory());
const priceTier_1 = require("./express/router/priceTier");
app.use('/priceTier', priceTier_1.PriceTier.RouterFactory());
const ticket_1 = require("./express/router/ticket");
app.use('/ticket', ticket_1.Ticket.RouterFactory());
const admin_1 = require("./express/router/admin");
app.use('/admin', admin_1.Admin.RouterFactory());
app.use('/*', function (_, res) {
    res.redirect("/web/");
});
app.use((output, req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (output instanceof database_1.RequestError || res.locals.RequestErrorList.length != 0) {
            if (res.locals.session.inTransaction()) {
                console.log("abort");
                yield res.locals.session.abortTransaction();
            }
            else {
            }
            if (output instanceof database_1.RequestError) {
                res.locals.RequestErrorList.push(output);
            }
            res.status(400).json({ success: false, reasons: res.locals.RequestErrorList.map((err) => err.message) });
        }
        else {
            if (res.locals.session.inTransaction()) {
                yield res.locals.session.commitTransaction();
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
}));
database_1.Database.init().then(_ => {
    app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Connect the client to the server	(optional starting in v4.7)
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
        }
        catch (_) {
        }
    }));
});
exports.default = app;
