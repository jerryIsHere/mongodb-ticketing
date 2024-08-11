"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDAO = exports.eventModel = void 0;
const database_1 = require("./database");
const dao_1 = require("./dao");
const venue_1 = require("./venue");
const ticket_1 = require("./ticket");
const seat_1 = require("./seat");
const mongoose_1 = require("mongoose");
const venue_2 = require("./venue");
const eventSchema = new mongoose_1.Schema({
    eventname: { type: String, required: true },
    datetime: { type: Date, required: true },
    startFirstRoundSellDate: { type: Date, required: true },
    endFirstRoundSellDate: { type: Date, required: true },
    startSecondRoundSellDate: { type: Date, required: true },
    endSecondRoundSellDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: [Number.MIN_VALUE, 'Duration must be greater than 0.'] },
    shoppingCartSize: { type: Number, required: true },
    firstRoundTicketQuota: { type: Number, required: true },
    secondRoundTicketQuota: { type: Number, required: true },
    venueId: { type: mongoose_1.Schema.Types.ObjectId, ref: venue_2.collection_name, required: true },
});
const collection_name = "events";
referentialIntegrity = function (event) {
};
eventSchema.pre('updateOne', { document: true, query: false }, function (next) {
});
exports.eventModel = (0, mongoose_1.model)(collection_name, eventSchema);
class EventDAO extends dao_1.BaseDAO {
    _eventname;
    get eventname() { return this._eventname; }
    set eventname(value) { this._eventname = value; }
    _datetime;
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
    _startFirstRoundSellDate;
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
    _endFirstRoundSellDate;
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
    _startSecondRoundSellDate;
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
    _endSecondRoundSellDate;
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
    _duration;
    get duration() { return this._duration; }
    set duration(value) {
        if (value && value < 0) {
            this.res.locals.RequestErrorList.push(new database_1.RequestError('Duration must be greater than 0.'));
        }
        else {
            this._duration = value;
        }
    }
    _shoppingCartSize;
    get shoppingCartSize() { return this._shoppingCartSize; }
    set shoppingCartSize(value) {
        this._shoppingCartSize = value;
    }
    _firstRoundTicketQuota;
    get firstRoundTicketQuota() { return this._firstRoundTicketQuota; }
    set firstRoundTicketQuota(value) {
        this._firstRoundTicketQuota = value;
    }
    _secondRoundTicketQuota;
    get secondRoundTicketQuota() { return this._secondRoundTicketQuota; }
    set secondRoundTicketQuota(value) {
        this._secondRoundTicketQuota = value;
    }
    _venueId;
    get venueId() { return this._venueId; }
    set venueId(value) {
        this._venueId = new ObjectId(value);
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
    static async listAll() {
        return new Promise(async (resolve, reject) => {
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
            resolve((await cursor.toArray()));
        });
    }
    static async listSelling() {
        return new Promise(async (resolve, reject) => {
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
            resolve((await cursor.toArray()));
        });
    }
    static async getById(res, id) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(EventDAO.collection_name).findOne({ _id: new ObjectId(id) }, { session: res.locals.session });
            if (doc) {
                resolve(new EventDAO(res, { doc: doc }));
            }
            reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
        });
    }
    async checkReference() {
        return database_1.Database.mongodb.collection(venue_1.VenueDAO.collection_name).findOne({ _id: this._venueId }, { session: this.res.locals.session }).then(instance => {
            if (instance == null) {
                return new database_1.RequestError(`Venue with id ${this._venueId} doesn't exists.`);
            }
            else {
                return null;
            }
        });
    }
    async create() {
        return new Promise(async (resolve, reject) => {
            this.res.locals.session.startTransaction();
            var referror = await this.checkReference();
            if (referror) {
                reject(referror);
                return;
            }
            var result = await database_1.Database.mongodb.collection(EventDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session });
            if (result.insertedId) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
            }
        });
    }
    async checkTicketVenueDependency() {
        if (this._id) {
            return (await database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).aggregate([
                { $match: { eventId: new ObjectId(this._id) } },
                {
                    $lookup: {
                        from: seat_1.SeatDAO.collection_name,
                        localField: "seatId",
                        foreignField: "_id",
                        as: "seat",
                    }
                },
                { $set: { 'seat': { $first: '$seat' } } },
                { $match: { 'seat.venueId': { $ne: new ObjectId(this.venueId) } } },
            ], { session: this.res.locals.session })).next();
        }
        return;
    }
    async update() {
        return new Promise(async (resolve, reject) => {
            var dependency = await this.checkTicketVenueDependency();
            if (dependency != null) {
                reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on another venue ${dependency.seat.venueId}.`));
                return;
            }
            if (this._id) {
                var result = await database_1.Database.mongodb.collection(EventDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session });
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
        });
    }
    async checkTicketDependency() {
        if (this._id) {
            return await database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).findOne({ eventId: new ObjectId(this._id) }, { session: this.res.locals.session });
        }
        return;
    }
    async delete() {
        return new Promise(async (resolve, reject) => {
            this.res.locals.session.startTransaction();
            var dependency = await this.checkTicketDependency();
            if (dependency) {
                reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on it.`));
                return;
            }
            if (this._id) {
                var result = await database_1.Database.mongodb.collection(EventDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) }, { session: this.res.locals.session });
                if (result.deletedCount > 0) {
                    resolve(this);
                }
            }
            else {
                reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                return;
            }
        });
    }
}
exports.EventDAO = EventDAO;
