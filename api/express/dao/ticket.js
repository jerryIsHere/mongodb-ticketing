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
const notification_1 = require("./notification");
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
            if (this.occupantId) {
                this.res.locals.session.startTransaction();
                let originalOccupant = yield user_1.UserDAO.getById(this.res, this.occupantId.toString()).catch(err => reject(err));
                if (originalOccupant && originalOccupant.email) {
                    this._occupantId = null;
                    try {
                        yield this.checkReference();
                    }
                    catch (err) {
                        reject(err);
                        return;
                    }
                    if (this.res.locals.RequestErrorList.length > 0)
                        reject(null);
                    if (this.id) {
                        database_1.Database.mongodb.collection(TicketDAO.collection_name)
                            .updateOne({ _id: this.id }, { $set: { "occupantId": null, paid: null, paymentRemark: null } }, { session: this.res.locals.session }).then((value) => __awaiter(this, void 0, void 0, function* () {
                            if (value.modifiedCount > 0) {
                                if (this.seatId && this.eventId && originalOccupant && originalOccupant.email) {
                                    let seatDao = yield seat_1.SeatDAO.getById(this.res, this.seatId.toString()).catch(err => console.log(err));
                                    let eventDao = yield event_1.EventDAO.getById(this.res, this.eventId.toString()).catch(err => console.log(err));
                                    let notificationDao = new notification_1.NotificationDAO(this.res, {
                                        email: originalOccupant.email,
                                        title: "Ticket Voided",
                                        message: `1 ticket that you had purchased is voided. Information of that ticket:
Event: ${eventDao ? eventDao.eventname : ''}
Seat: ${seatDao && seatDao.row && seatDao.no ? seatDao.row + seatDao.no : ''}`,
                                        recipientId: originalOccupant.id
                                    });
                                    yield notificationDao.create().catch(err => reject(err));
                                    notificationDao.send().catch(err => console.log(err));
                                }
                                resolve(this);
                            }
                        }));
                    }
                    else {
                        reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                    }
                }
                else {
                    if (originalOccupant instanceof Object && originalOccupant.email == undefined) {
                        reject(new database_1.RequestError(`Ticket with id ${this.id} has an occupant without email information.`));
                    }
                    if (originalOccupant)
                        reject(new database_1.RequestError(`Ticket with id ${this.id} has an invalid occupant.`));
                    return;
                }
            }
            else {
                reject(new database_1.RequestError(`Ticket with id ${this.id} is already avaliable.`));
                return;
            }
        }));
    }
    claim(userId) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            this.res.locals.session.startTransaction();
            let originalOccupant = yield user_1.UserDAO.getById(this.res, userId).catch(err => reject(err));
            if (originalOccupant && originalOccupant.email) {
                if (this.id) {
                    database_1.Database.mongodb.collection(TicketDAO.collection_name)
                        .updateOne({ _id: this.id, occupantId: null }, { $set: { "occupantId": userId } }, { session: this.res.locals.session }).then((value) => __awaiter(this, void 0, void 0, function* () {
                        if (value.modifiedCount > 0) {
                            if (originalOccupant && originalOccupant.email) {
                                let notificationDao = new notification_1.NotificationDAO(this.res, {
                                    email: originalOccupant.email,
                                    title: "Ticket Purchased",
                                    message: `1 ticket purchased, for follow-up info, please visit: ${process.env.BASE_PRODUCTION_URI}/payment-info?ids=${this.id}`,
                                    recipientId: userId
                                });
                                yield notificationDao.create().catch(err => reject(err));
                                notificationDao.send().catch(err => console.log(err));
                            }
                            resolve(this);
                        }
                        else {
                            reject(new database_1.RequestError(`Ticket with id ${this.id} is not avaliable.`));
                            return;
                        }
                    }));
                }
                else {
                    reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                    return;
                }
            }
            this._occupantId = new mongodb_1.ObjectId(userId);
            try {
                yield this.checkReference(true);
            }
            catch (err) {
                reject(err);
                return;
            }
        }));
    }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        this._paid = null;
        this._paymentRemark = null;
        this._occupantId = null;
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
    static getById(res, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var doc = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                if (doc) {
                    resolve(new TicketDAO(res, { doc: doc }));
                }
                reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }));
        });
    }
    static getByIds(res, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                Promise.all(ids.map((id) => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                        var doc = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                        if (doc) {
                            daoresolve(new TicketDAO(res, { doc: doc }));
                        }
                        daoreject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
                    }));
                }))).then(daos => {
                    resolve(daos);
                });
            }));
        });
    }
    checkReference(checkIsSelling = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._eventId == undefined) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`Ticket with id ${this._id} has no associate event.`));
                return null;
            }
            var event = yield event_1.EventDAO.getById(this.res, this._eventId.toString());
            var condition = checkIsSelling ?
                (event && event.startSellDate && event.endSellDate &&
                    event.startSellDate <= new Date() && event.endSellDate >= new Date()) : event;
            if (condition) {
                let venueId = event.venueId;
                yield database_1.Database.mongodb.collection(priceTier_1.PriceTierDAO.collection_name).findOne({ _id: this._priceTierId }).then(instance => {
                    if (instance == null) {
                        this.res.locals.RequestErrorList.push(new database_1.RequestError(`Price Tier with id ${this._priceTierId} doesn't exists.`));
                    }
                });
                yield database_1.Database.mongodb.collection(seat_1.SeatDAO.collection_name).findOne({ _id: this._seatId, venueId: venueId }).then(instance => {
                    if (instance == null) {
                        this.res.locals.RequestErrorList.push(new database_1.RequestError(`Seat with id ${this._seatId} in the same event venue with id ${venueId} doesn't exists.`));
                    }
                });
                if (this._occupantId)
                    yield database_1.Database.mongodb.collection(user_1.UserDAO.collection_name).findOne({ _id: this._occupantId }).then(instance => {
                        if (instance == null) {
                            this.res.locals.RequestErrorList.push(new database_1.RequestError(`User with id ${this._seatId} doesn't exists.`));
                        }
                    });
            }
            else {
                if (event == null)
                    this.res.locals.RequestErrorList.push(new database_1.RequestError(`Event with id ${this._eventId} doesn't exists.`));
                if (!checkIsSelling)
                    return null;
                if (event.startSellDate == undefined || event.startSellDate > new Date())
                    this.res.locals.RequestErrorList.push(new database_1.RequestError(`Ticket selling of event with id ${this._eventId} is not started yet.`));
                if (event.endSellDate == undefined || event.endSellDate < new Date())
                    this.res.locals.RequestErrorList.push(new database_1.RequestError(`Ticket selling of event with id ${this._eventId} was ended.`));
                return null;
            }
        });
    }
    duplicationChecking() {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ eventId: this.eventId, seatId: this.seatId }).then(instance => {
                if (instance) {
                    this.res.locals.RequestErrorList.push(new database_1.RequestError(`Ticket with same event with id ${this.eventId} and seat with id ${this.seatId} already exists.`));
                }
            });
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.res.locals.session.startTransaction();
                try {
                    yield this.checkReference();
                    yield this.duplicationChecking();
                }
                catch (err) {
                    reject(err);
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session });
                if (result.insertedId) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
                }
            }));
        });
    }
    static batchCreate(res, daos) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                res.locals.session.startTransaction();
                Promise.all(daos.map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield dao.checkReference();
                        yield dao.duplicationChecking();
                    }
                    catch (err) {
                        daoreject(err);
                        return;
                    }
                    var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).insertOne(dao.Serialize(true), { session: res.locals.session });
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
    static batchUdatePriceTier(res, daos, priceTierId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                res.locals.session.startTransaction();
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
                        var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: dao._id }, { $set: dao.Serialize(true) }, { session: res.locals.session });
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
                var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session });
                if (result.modifiedCount > 0) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
                }
            }));
        });
    }
    static batchClaim(res, daos, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                res.locals.session.startTransaction();
                let originalOccupant = yield user_1.UserDAO.getById(res, userId).catch(err => reject(err));
                if (originalOccupant && originalOccupant.email) {
                    Promise.all(daos.map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                        dao._occupantId = new mongodb_1.ObjectId(userId);
                        try {
                            yield dao.checkReference(true);
                        }
                        catch (err) {
                            daoreject(err);
                            return;
                        }
                        if (dao.id) {
                            var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: dao.id, occupantId: null }, { $set: { "occupantId": userId } }, { session: res.locals.session });
                            if (result.modifiedCount > 0) {
                                daoresolve(dao);
                            }
                            else {
                                daoreject(new database_1.RequestError(`Ticket with id ${dao.id} is not avaliable.`));
                            }
                        }
                    })))).then((daos) => __awaiter(this, void 0, void 0, function* () {
                        if (originalOccupant && originalOccupant.email) {
                            let notificationDao = new notification_1.NotificationDAO(res, {
                                title: "Ticket Purchased",
                                email: originalOccupant.email,
                                message: `${daos.length} ticket purchased, for follow-up info, please visit: ${process.env.BASE_PRODUCTION_URI}/payment-info?`
                                    + daos.map(dao => { var _a; return 'ids=' + ((_a = dao._id) === null || _a === void 0 ? void 0 : _a.toString()); }).join('&'),
                                recipientId: userId
                            });
                            yield notificationDao.create().catch(err => reject(err));
                            notificationDao.send().catch(err => console.log(err));
                        }
                        resolve(daos);
                    }));
                }
                else {
                    if (originalOccupant instanceof Object && originalOccupant.email == undefined) {
                        reject(new database_1.RequestError(`User with id ${userId} has an occupant without email information.`));
                    }
                    if (originalOccupant)
                        reject(new database_1.RequestError(`User id ${userId} not found.`));
                    return;
                }
            }));
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this._id == undefined) {
                    reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) }, { session: this.res.locals.session });
                if (result.deletedCount > 0) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
                }
            }));
        });
    }
    static batchDelete(res, daos) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                res.locals.session.startTransaction();
                Promise.all(daos.filter(dao => dao.id != undefined).map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                    if (dao.occupantId != null) {
                        daoreject(new database_1.RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed as it has occupant.`));
                    }
                    var result = yield database_1.Database.mongodb.collection(TicketDAO.collection_name).deleteOne(dao.Serialize(true), { session: res.locals.session });
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
