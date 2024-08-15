"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const database_1 = require("./server/database/database");
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
app.use('*', async function (req, res, next) {
    res.locals.RequestErrorList = new Array();
    next();
});
app.use(express_1.default.json());
const user_1 = require("./server/router/user");
app.use('/user', user_1.User.RouterFactory());
const event_1 = require("./server/router/event");
app.use('/event', event_1.Event.RouterFactory());
const seat_1 = require("./server/router/seat");
app.use('/seat', seat_1.Seat.RouterFactory());
const venue_1 = require("./server/router/venue");
app.use('/venue', venue_1.Venue.RouterFactory());
const ticket_1 = require("./server/router/ticket");
const error_1 = require("./mongoose-schema/error");
app.use('/ticket', ticket_1.Ticket.RouterFactory());
app.use('/*', function (_, res) {
    res.redirect("/web/");
});
app.use(async (output, req, res, next) => {
    try {
        if (output instanceof Error || output instanceof database_1.RequestError || res.locals.RequestErrorList.length != 0) {
            if (res.locals.session?.inTransaction()) {
                console.log("abort");
                await res.locals.session.abortTransaction();
            }
            else {
            }
            if (output instanceof database_1.RequestError) {
                res.locals.RequestErrorList.push(output);
            }
            else if (output instanceof Error && (output.name == 'ValidationError' ||
                output instanceof error_1.ValidationError ||
                output instanceof error_1.ReferentialError ||
                output instanceof error_1.OperationError)) {
                res.locals.RequestErrorList.push(new database_1.RequestError(output.message));
            }
            else if (output instanceof Error) {
                // unknow error is not presentable to end user
                // as it might contains confidential info / technical jargons
                console.log(output);
                res.locals.RequestErrorList.push(new database_1.RequestError("Unexpected error occured."));
            }
            res.status(400).json({ success: false, reasons: res.locals.RequestErrorList.map((err) => err.message) });
        }
        else {
            if (res.locals.session?.inTransaction()) {
                await res.locals.session.commitTransaction();
                res.json(output);
            }
            else {
                res.json(output);
            }
        }
        res.locals.session?.endSession();
    }
    catch (err) {
        console.log(err);
    }
    finally {
        next();
    }
});
Promise.all([database_1.Database.init()])
    .catch(e => {
    console.error(e);
})
    .finally(() => {
    app.listen(port, () => { console.log("Server ready!"); });
});
exports.default = app;
