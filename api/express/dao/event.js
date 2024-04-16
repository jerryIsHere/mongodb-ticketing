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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDAO = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const dao_1 = require("./dao");
const venue_1 = require("./venue");
const ticket_1 = require("./ticket");
const seat_1 = require("./seat");
class EventDAO extends dao_1.BaseDAO {
    get eventname() { return this._eventname; }
    set eventname(value) { this._eventname = value; }
    get datetime() { return this._datetime; }
    set datetime(value) {
        if (typeof value == "string") {
            try {
                this._datetime = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError("Cannot parse datetime parameter of event request"));
            }
        }
        else if (value instanceof Date) {
            this._datetime = value;
        }
    }
    get startFirstRoundSellDate() { return this._startFirstRoundSellDate; }
    set startFirstRoundSellDate(value) {
        if (typeof value == "string") {
            try {
                this._startFirstRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError("Cannot parse startFirstRoundSellDate parameter of event request"));
            }
        }
        else if (value instanceof Date) {
            this._startFirstRoundSellDate = value;
        }
    }
    get endFirstRoundSellDate() { return this._endFirstRoundSellDate; }
    set endFirstRoundSellDate(value) {
        if (typeof value == "string") {
            try {
                this._endFirstRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError("Cannot parse endFirstRoundSellDate parameter of event request"));
            }
        }
        else if (value instanceof Date) {
            this._endFirstRoundSellDate = value;
        }
    }
    get startSecondRoundSellDate() { return this._startSecondRoundSellDate; }
    set startSecondRoundSellDate(value) {
        if (typeof value == "string") {
            try {
                this._startSecondRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError("Cannot parse startSecondRoundSellDate parameter of event request"));
            }
        }
        else if (value instanceof Date) {
            this._startSecondRoundSellDate = value;
        }
    }
    get endSecondRoundSellDate() { return this._endSecondRoundSellDate; }
    set endSecondRoundSellDate(value) {
        if (typeof value == "string") {
            try {
                this._endSecondRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError("Cannot parse endSecondRoundSellDate parameter of event request"));
            }
        }
        else if (value instanceof Date) {
            this._endSecondRoundSellDate = value;
        }
    }
    get duration() { return this._duration; }
    set duration(value) {
        if (value && value < 0) {
            this.res.locals.RequestErrorList.push(new database_1.RequestError('Duration must be greater then 0.'));
        }
        else {
            this._duration = value;
        }
    }
    get shoppingCartSize() { return this._shoppingCartSize; }
    set shoppingCartSize(value) {
        this._shoppingCartSize = value;
    }
    get firstRoundTicketQuota() { return this._firstRoundTicketQuota; }
    set firstRoundTicketQuota(value) {
        this._firstRoundTicketQuota = value;
    }
    get secondRoundTicketQuota() { return this._secondRoundTicketQuota; }
    set secondRoundTicketQuota(value) {
        this._secondRoundTicketQuota = value;
    }
    get venueId() { return this._venueId; }
    set venueId(value) {
        this._venueId = new mongodb_1.ObjectId(value);
    }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._eventname = params.doc.eventname;
            this._datetime = params.doc.datetime;
            this._startFirstRoundSellDate = params.doc.startFirstRoundSellDate;
            this._endFirstRoundSellDate = params.doc.endFirstRoundSellDate;
            this._startSecondRoundSellDate = params.doc.startSecondRoundSellDate;
            this._endSecondRoundSellDate = params.doc.endSecondRoundSellDate;
            this._shoppingCartSize = params.doc.shoppingCartSize;
            this._firstRoundTicketQuota = params.doc.firstRoundTicketQuota;
            this._secondRoundTicketQuota = params.doc.secondRoundTicketQuota;
            this._duration = params.doc.duration;
            this._venueId = params.doc.venueId;
        }
        if (params.eventname)
            this.eventname = params.eventname;
        if (params.datetime)
            this.datetime = params.datetime;
        if (params.startFirstRoundSellDate)
            this.startFirstRoundSellDate = params.startFirstRoundSellDate;
        if (params.endFirstRoundSellDate)
            this.endFirstRoundSellDate = params.endFirstRoundSellDate;
        if (params.startSecondRoundSellDate)
            this.startSecondRoundSellDate = params.startSecondRoundSellDate;
        if (params.endSecondRoundSellDate)
            this.endSecondRoundSellDate = params.endSecondRoundSellDate;
        if (params.shoppingCartSize)
            this.shoppingCartSize = params.shoppingCartSize;
        if (params.firstRoundTicketQuota)
            this.firstRoundTicketQuota = params.firstRoundTicketQuota;
        if (params.secondRoundTicketQuota)
            this.secondRoundTicketQuota = params.secondRoundTicketQuota;
        if (params.duration)
            this.duration = params.duration;
    }
    static listAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(EventDAO.collection_name).aggregate([
                    {
                        $lookup: {
                            from: venue_1.VenueDAO.collection_name,
                            localField: "venueId",
                            foreignField: "_id",
                            as: "venue",
                        }
                    },
                    { $set: { 'venue': { $first: '$venue' } } }
                ]);
                resolve((yield cursor.toArray()));
            }));
        });
    }
    static listSelling() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(EventDAO.collection_name).aggregate([
                    {
                        $match: {
                            $or: [
                                {
                                    $and: [
                                        { startFirstRoundSellDate: { $lte: new Date() } },
                                        { endFirstRoundSellDate: { $gte: new Date() } },
                                    ]
                                },
                                {
                                    $and: [
                                        { startSecondRoundSellDate: { $lte: new Date() } },
                                        { endSecondRoundSellDate: { $gte: new Date() } },
                                    ]
                                },
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: venue_1.VenueDAO.collection_name,
                            localField: "venueId",
                            foreignField: "_id",
                            as: "venue",
                        }
                    },
                    { $set: { 'venue': { $first: '$venue' } } }
                ]);
                resolve((yield cursor.toArray()));
            }));
        });
    }
    static getById(res, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var doc = yield database_1.Database.mongodb.collection(EventDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) }, { session: res.locals.session });
                if (doc) {
                    resolve(new EventDAO(res, { doc: doc }));
                }
                reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }));
        });
    }
    checkReference() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.Database.mongodb.collection(venue_1.VenueDAO.collection_name).findOne({ _id: this._venueId }, { session: this.res.locals.session }).then(instance => {
                if (instance == null) {
                    return new database_1.RequestError(`Venue with id ${this._venueId} doesn't exists.`);
                }
                else {
                    return null;
                }
            });
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.res.locals.session.startTransaction();
                var referror = yield this.checkReference();
                if (referror) {
                    reject(referror);
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(EventDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session });
                if (result.insertedId) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
                }
            }));
        });
    }
    checkTicketVenueDependency() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._id) {
                return (yield database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).aggregate([
                    { $match: { eventId: new mongodb_1.ObjectId(this._id) } },
                    {
                        $lookup: {
                            from: seat_1.SeatDAO.collection_name,
                            localField: "seatId",
                            foreignField: "_id",
                            as: "seat",
                        }
                    },
                    { $set: { 'seat': { $first: '$seat' } } },
                    { $match: { 'seat.venueId': { $ne: new mongodb_1.ObjectId(this.venueId) } } },
                ], { session: this.res.locals.session })).next();
            }
            return;
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var dependency = yield this.checkTicketVenueDependency();
                if (dependency != null) {
                    reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed ` +
                        `as ticket with id ${dependency._id} depends on another venue ${dependency.seat.venueId}.`));
                    return;
                }
                if (this._id) {
                    var result = yield database_1.Database.mongodb.collection(EventDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session });
                    if (result.modifiedCount > 0) {
                        resolve(this);
                    }
                    else {
                        reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
                    }
                }
                else {
                    reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                }
            }));
        });
    }
    checkTicketDependency() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._id) {
                return yield database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).findOne({ eventId: new mongodb_1.ObjectId(this._id) }, { session: this.res.locals.session });
            }
            return;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.res.locals.session.startTransaction();
                var dependency = yield this.checkTicketDependency();
                if (dependency) {
                    reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                        `as ticket with id ${dependency._id} depends on it.`));
                    return;
                }
                if (this._id) {
                    var result = yield database_1.Database.mongodb.collection(EventDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) }, { session: this.res.locals.session });
                    if (result.deletedCount > 0) {
                        resolve(this);
                    }
                }
                else {
                    reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                    return;
                }
            }));
        });
    }
}
exports.EventDAO = EventDAO;
EventDAO.collection_name = "events";
