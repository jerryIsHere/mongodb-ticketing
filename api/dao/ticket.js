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
exports.TicketDAO = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const dao_1 = require("./dao");
const event_1 = require("./event");
const priceTier_1 = require("./priceTier");
const seat_1 = require("./seat");
const user_1 = require("./user");
class TicketDAO extends dao_1.BaseDAO {
    get eventId() { return this._eventId; }
    set eventId(value) {
        this._eventId = new mongodb_1.ObjectId(value);
    }
    get seatId() { return this._seatId; }
    set seatId(value) {
        this._seatId = new mongodb_1.ObjectId(value);
    }
    get priceTierId() { return this._priceTierId; }
    set priceTierId(value) {
        this._priceTierId = new mongodb_1.ObjectId(value);
    }
    get paid() { return this._paid; }
    set paid(value) {
        this._paid = value;
    }
    get paymentRemark() { return this._paymentRemark; }
    set paymentRemark(value) {
        this._paymentRemark = value;
    }
    get occupantId() { return this._occupantId; }
    void() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            database_1.Database.session.startTransaction();
            this._occupantId = null;
            try {
                yield this.checkReference();
            }
            catch (err) {
                reject(err);
                return;
            }
            if (this.id) {
                database_1.Database.mongodb.collection(TicketDAO.collection_name)
                    .updateOne({ _id: this.id }, { $set: { "occupantId": null, paid: null, paymentRemark: null } }).then((value) => {
                    if (value.modifiedCount > 0) {
                        resolve(this);
                    }
                    else {
                        reject(new database_1.RequestError(`Ticket with id ${this.id} is already avaliable.`));
                        return;
                    }
                });
            }
        }));
    }
    claim(userId) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            database_1.Database.session.startTransaction();
            this._occupantId = new mongodb_1.ObjectId(userId);
            try {
                yield this.checkReference();
            }
            catch (err) {
                reject(err);
                return;
            }
            if (this.id) {
                database_1.Database.mongodb.collection(TicketDAO.collection_name)
                    .updateOne({ _id: this.id, occupantId: null }, { $set: { "occupantId": userId } }).then((value) => {
                    if (value.modifiedCount > 0) {
                        resolve(this);
                    }
                    else {
                        reject(new database_1.RequestError(`Ticket with id ${this.id} is not avaliable.`));
                        return;
                    }
                });
            }
            else {
                reject(new database_1.RequestError(`${this.constructor.name} with id ${userId} doesn't exists.`));
                return;
            }
        }));
    }
    constructor(params) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._eventId = params.doc.eventId;
            this._seatId = params.doc.seatId;
            this._occupantId = params.doc.occupantId;
            this._priceTierId = params.doc.priceTierId;
            this._paid = params.doc.paid;
            this._paymentRemark = params.doc.paymentRemark;
        }
        if (params.paid)
            this.paid = params.paid;
        if (params.paymentRemark)
            this.paymentRemark = params.paymentRemark;
    }
    Serialize(pushErrorWhenUndefined) {
        var obj = this.PropertiesWithGetter();
        if (pushErrorWhenUndefined) {
            var undefinedEntries = Object.entries(obj).filter(e => e[1] === undefined).filter(entry => entry[0] != "occupantId" && entry[0] != "paid" && entry[0] != "paymentRemark");
            if (undefinedEntries.length > 0)
                dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Undefined entries: ${undefinedEntries.map(e => e[0]).join(", ")}`));
        }
        return obj;
    }
    static listByEventId(evnetId, showOccupant) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                    aggregate(this.aggregateQuery({ $match: { eventId: new mongodb_1.ObjectId(evnetId) } }, showOccupant));
                resolve((yield cursor.toArray()));
            }));
        });
    }
    static listSold(showOccupant) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                    aggregate(this.aggregateQuery({ $match: { occupantId: { $ne: null } } }, showOccupant));
                resolve((yield cursor.toArray()));
            }));
        });
    }
    static listByIds(ids, showOccupant) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                    aggregate(this.aggregateQuery({ $match: { _id: { $in: ids.map(id => new mongodb_1.ObjectId(id)) } } }, showOccupant));
                resolve((yield cursor.toArray()));
            }));
        });
    }
    static ofUser(userId, showOccupant) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                    aggregate(this.aggregateQuery({ $match: { occupantId: new mongodb_1.ObjectId(userId) } }, showOccupant));
                resolve((yield cursor.toArray()));
            }));
        });
    }
    static getWithDetailsById(id, showOccupant) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                    aggregate(this.aggregateQuery({ $match: { occupantId: new mongodb_1.ObjectId(id) } }, showOccupant));
                var docs = yield cursor.toArray();
                if (docs.length > 0) {
                    resolve(docs[0]);
                }
                else {
                    reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
                }
            }));
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var doc = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                if (doc) {
                    resolve(new TicketDAO({ doc: doc }));
                }
                reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }));
        });
    }
    static getByIds(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                Promise.all(ids.map((id) => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                        var doc = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                        if (doc) {
                            daoresolve(new TicketDAO({ doc: doc }));
                        }
                        daoreject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
                    }));
                }))).then(daos => {
                    resolve(daos);
                });
            }));
        });
    }
    checkReference() {
        return __awaiter(this, void 0, void 0, function* () {
            var eventdoc = yield database_1.Database.mongodb.collection(event_1.EventDAO.collection_name).findOne({ _id: this._eventId });
            if (eventdoc) {
                let venueId = eventdoc.venueId;
                yield database_1.Database.mongodb.collection(priceTier_1.PriceTierDAO.collection_name).findOne({ _id: this._priceTierId }).then(instance => {
                    if (instance == null) {
                        dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Price Tier with id ${this._priceTierId} doesn't exists.`));
                    }
                });
                yield database_1.Database.mongodb.collection(seat_1.SeatDAO.collection_name).findOne({ _id: this._seatId, venueId: venueId }).then(instance => {
                    if (instance == null) {
                        dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Seat with id ${this._seatId} in the same event venue with id ${venueId} doesn't exists.`));
                    }
                });
                if (this._occupantId)
                    yield database_1.Database.mongodb.collection(user_1.UserDAO.collection_name).findOne({ _id: this._occupantId }).then(instance => {
                        if (instance == null) {
                            dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`User with id ${this._seatId} doesn't exists.`));
                        }
                    });
            }
            else {
                dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Event with id ${this._eventId} doesn't exists.`));
                return null;
            }
        });
    }
    duplicationChecking() {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ eventId: this.eventId, seatId: this.seatId }).then(instance => {
                if (instance) {
                    dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Ticket with same event with id ${this.eventId} and seat with id ${this.seatId} already exists.`));
                }
            });
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                database_1.Database.session.startTransaction();
                try {
                    yield this.checkReference();
                    yield this.duplicationChecking();
                }
                catch (err) {
                    reject(err);
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).insertOne(this.Serialize(true));
                if (result.insertedId) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
                }
            }));
        });
    }
    static batchCreate(daos) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                database_1.Database.session.startTransaction();
                Promise.all(daos.map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield dao.checkReference();
                        yield dao.duplicationChecking();
                    }
                    catch (err) {
                        daoreject(err);
                        return;
                    }
                    var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).insertOne(dao.Serialize(true));
                    if (result.insertedId) {
                        daoresolve(dao);
                    }
                    else {
                        daoreject(new database_1.RequestError(`Creation of ${dao.constructor.name} failed with unknown reason.`));
                    }
                })))).then(daos => {
                    resolve(daos);
                });
            });
        });
    }
    static batchUdatePriceTier(daos, priceTierId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                database_1.Database.session.startTransaction();
                Promise.all(daos.map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        dao.priceTierId = new mongodb_1.ObjectId(priceTierId);
                        yield dao.checkReference();
                    }
                    catch (err) {
                        daoreject(err);
                        return;
                    }
                    if (dao._id) {
                        var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: dao._id }, { $set: dao.Serialize(true) });
                        if (result) {
                            daoresolve(dao);
                        }
                        else {
                            daoreject(new database_1.RequestError(`Update of ${dao.constructor.name} failed with unknown reason.`));
                        }
                    }
                    else {
                        reject(new database_1.RequestError(`One of the ticket's id is not initialized.`));
                    }
                })))).then(daos => {
                    resolve(daos);
                });
            });
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this._id == undefined) {
                    reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                    return;
                }
                try {
                    yield this.checkReference();
                }
                catch (err) {
                    reject(err);
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) });
                if (result.modifiedCount > 0) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
                }
            }));
        });
    }
    static batchClaim(daos, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                database_1.Database.session.startTransaction();
                Promise.all(daos.map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                    dao._occupantId = new mongodb_1.ObjectId(userId);
                    try {
                        yield dao.checkReference();
                    }
                    catch (err) {
                        daoreject(err);
                        return;
                    }
                    if (dao.id) {
                        var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: dao.id, occupantId: null }, { $set: { "occupantId": userId } });
                        if (result.modifiedCount > 0) {
                            daoresolve(dao);
                        }
                        else {
                            daoreject(new database_1.RequestError(`Ticket with id ${dao.id} is not avaliable.`));
                        }
                    }
                })))).then(daos => {
                    resolve(daos);
                });
            });
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this._id == undefined) {
                    reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) });
                if (result.deletedCount > 0) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
                }
            }));
        });
    }
    static batchDelete(daos) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                database_1.Database.session.startTransaction();
                Promise.all(daos.filter(dao => dao.id != undefined).map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                    if (dao.occupantId != null) {
                        daoreject(new database_1.RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed as it has occupant.`));
                    }
                    var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).deleteOne(dao.Serialize(true));
                    if (result.deletedCount > 0) {
                        daoresolve(dao);
                    }
                    else {
                        daoreject(new database_1.RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed with unknown reason.`));
                    }
                })))).then(daos => {
                    resolve(daos);
                });
            });
        });
    }
}
exports.TicketDAO = TicketDAO;
TicketDAO.collection_name = "tickets";
TicketDAO.aggregateQuery = (condition, showOccupant) => {
    return [
        ...[
            condition,
            {
                $lookup: {
                    from: event_1.EventDAO.collection_name,
                    localField: "eventId",
                    foreignField: "_id",
                    as: "event",
                }
            },
            {
                $lookup: {
                    from: seat_1.SeatDAO.collection_name,
                    localField: "seatId",
                    foreignField: "_id",
                    as: "seat",
                }
            },
            {
                $lookup: {
                    from: priceTier_1.PriceTierDAO.collection_name,
                    localField: "priceTierId",
                    foreignField: "_id",
                    as: "priceTier",
                }
            },
        ], ...showOccupant ? [
            {
                $lookup: {
                    from: user_1.UserDAO.collection_name,
                    localField: "occupantId",
                    foreignField: "_id",
                    as: "occupant",
                }
            },
            { $set: { 'occupant': { $first: '$occupant' } } }
        ] :
            [
                { $set: { 'occupied': { $cond: { if: { $ne: ["$occupantId", null] }, then: true, else: false } } } },
                { $project: { occupantId: 0 } },
            ],
        ...[
            { $set: { 'event': { $first: '$event' } } },
            { $set: { 'seat': { $first: '$seat' } } },
            { $set: { 'priceTier': { $first: '$priceTier' } } },
        ]
    ];
};
