"use strict";
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
    static collection_name = "tickets";
    _eventId;
    get eventId() { return this._eventId; }
    set eventId(value) {
        this._eventId = new mongodb_1.ObjectId(value);
    }
    _seatId;
    get seatId() { return this._seatId; }
    set seatId(value) {
        this._seatId = new mongodb_1.ObjectId(value);
    }
    _priceTierId;
    get priceTierId() { return this._priceTierId; }
    set priceTierId(value) {
        this._priceTierId = new mongodb_1.ObjectId(value);
    }
    _securedBy = null;
    get securedBy() { return this._securedBy; }
    set securedBy(value) {
        this._securedBy = value;
    }
    _remark = null;
    get remark() { return this._remark; }
    set remark(value) {
        this._remark = value;
    }
    _occupantId = null;
    get occupantId() { return this._occupantId; }
    void() {
        return new Promise(async (resolve, reject) => {
            if (this.occupantId) {
                this.res.locals.session.startTransaction();
                let originalOccupant = await user_1.UserDAO.getById(this.res, this.occupantId.toString()).catch(err => reject(err));
                if (originalOccupant && originalOccupant.email) {
                    this._occupantId = null;
                    try {
                        await this.checkReference();
                    }
                    catch (err) {
                        reject(err);
                        return;
                    }
                    if (this.res.locals.RequestErrorList.length > 0)
                        reject(null);
                    if (this.id) {
                        database_1.Database.mongodb.collection(TicketDAO.collection_name)
                            .updateOne({ _id: this.id }, { $set: { "occupantId": null, securedBy: null, remark: null } }, { session: this.res.locals.session }).then(async (value) => {
                            if (value.modifiedCount > 0) {
                                if (this.seatId && this.eventId && originalOccupant && originalOccupant.email) {
                                    let seatDao = await seat_1.SeatDAO.getById(this.res, this.seatId.toString()).catch(err => console.log(err));
                                    let eventDao = await event_1.EventDAO.getById(this.res, this.eventId.toString()).catch(err => console.log(err));
                                    let notificationDao = new notification_1.NotificationDAO(this.res, {
                                        email: originalOccupant.email,
                                        title: "Ticket Voided",
                                        message: `1 ticket that you had purchased is voided. Information of that ticket:
Event: ${eventDao ? eventDao.eventname : ''}
Seat: ${seatDao && seatDao.row && seatDao.no ? seatDao.row + seatDao.no : ''}`,
                                        recipientId: originalOccupant.id
                                    });
                                    await notificationDao.create().catch(err => reject(err));
                                    notificationDao.send().catch(err => console.log(err));
                                }
                                resolve(this);
                            }
                        });
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
        });
    }
    claim(userId) {
        return new Promise(async (resolve, reject) => {
            this.res.locals.session.startTransaction();
            let originalOccupant = await user_1.UserDAO.getById(this.res, userId).catch(err => reject(err));
            if (originalOccupant && originalOccupant.email) {
                if (this.id) {
                    database_1.Database.mongodb.collection(TicketDAO.collection_name)
                        .updateOne({ _id: this.id, occupantId: null }, { $set: { "occupantId": userId } }, { session: this.res.locals.session }).then(async (value) => {
                        if (value.modifiedCount > 0) {
                            if (originalOccupant && originalOccupant.email) {
                                let notificationDao = new notification_1.NotificationDAO(this.res, {
                                    email: originalOccupant.email,
                                    title: "Ticket Purchased",
                                    message: `1 ticket purchased, for follow-up info, please visit: ${process.env.BASE_PRODUCTION_URI}/payment-info?ids=${this.id}`,
                                    recipientId: userId
                                });
                                await notificationDao.create().catch(err => reject(err));
                                notificationDao.send().catch(err => console.log(err));
                            }
                            resolve(this);
                        }
                        else {
                            reject(new database_1.RequestError(`Ticket with id ${this.id} is not avaliable.`));
                            return;
                        }
                    });
                }
                else {
                    reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                    return;
                }
            }
            this._occupantId = new mongodb_1.ObjectId(userId);
            try {
                await this.checkReference(true, new mongodb_1.ObjectId(userId));
            }
            catch (err) {
                reject(err);
                return;
            }
        });
    }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._eventId = params.doc.eventId;
            this._seatId = params.doc.seatId;
            this._occupantId = params.doc.occupantId;
            this._priceTierId = params.doc.priceTierId;
            this._securedBy = params.doc.securedBy;
            this._remark = params.doc.remark;
        }
        if (params.securedBy)
            this.securedBy = params.securedBy;
        if (params.remark)
            this.remark = params.remark;
    }
    static lookupQuery = (condition, param) => {
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
            ],
            ...param.checkIfBelongsToUser ? [
                { $set: { 'belongsToUser': { $cond: { if: { $eq: ["$occupantId", new mongodb_1.ObjectId(param.checkIfBelongsToUser)] }, then: true, else: false } } } },
            ] : [],
            ...param.showOccupant ? [
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
    static async listByEventId(evnetId, param) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.lookupQuery({ $match: { eventId: new mongodb_1.ObjectId(evnetId) } }, param));
            resolve((await cursor.toArray()));
        });
    }
    static async listSold(param) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.lookupQuery({ $match: { occupantId: { $ne: null } } }, param));
            resolve((await cursor.toArray()));
        });
    }
    static async listByIds(ids, param) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.lookupQuery({ $match: { _id: { $in: ids.map(id => new mongodb_1.ObjectId(id)) } } }, param));
            resolve((await cursor.toArray()));
        });
    }
    static async ofUser(userId, param) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.lookupQuery({ $match: { occupantId: new mongodb_1.ObjectId(userId) } }, param));
            resolve((await cursor.toArray()));
        });
    }
    static async getWithDetailsById(id, param) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.lookupQuery({ $match: { occupantId: new mongodb_1.ObjectId(id) } }, param));
            var docs = await cursor.toArray();
            if (docs.length > 0) {
                resolve(docs[0]);
            }
            else {
                reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }
        });
    }
    static async getById(res, id) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
            if (doc) {
                resolve(new TicketDAO(res, { doc: doc }));
            }
            reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
        });
    }
    static async getByIds(res, ids) {
        return new Promise(async (resolve, reject) => {
            Promise.all(ids.map(async (id) => new Promise(async (daoresolve, daoreject) => {
                var doc = await database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                if (doc) {
                    daoresolve(new TicketDAO(res, { doc: doc }));
                }
                daoreject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }))).then(daos => {
                resolve(daos);
            });
        });
    }
    async checkReference(checkIsSelling = false, checkQuotaForUserId, purchaseQuantity = 1) {
        if (this._eventId == undefined) {
            this.res.locals.RequestErrorList.push(new database_1.RequestError(`Ticket with id ${this._id} has no associate event.`));
            return null;
        }
        var event = await event_1.EventDAO.getById(this.res, this._eventId.toString());
        if (event && event.startFirstRoundSellDate &&
            event.endFirstRoundSellDate &&
            event.startSecondRoundSellDate &&
            event.endSecondRoundSellDate &&
            event.shoppingCartSize != undefined && Number.isFinite(Number(event.shoppingCartSize)) &&
            event.firstRoundTicketQuota != undefined && Number.isFinite(Number(event.firstRoundTicketQuota)) &&
            event.secondRoundTicketQuota != undefined && Number.isFinite(Number(event.secondRoundTicketQuota))) {
            if (checkIsSelling) {
                var isSelling = (event.startFirstRoundSellDate <= new Date() && event.endFirstRoundSellDate >= new Date()) ||
                    (event.startSecondRoundSellDate <= new Date() && event.endSecondRoundSellDate >= new Date());
                if (!isSelling) {
                    this.res.locals.RequestErrorList.push(new database_1.RequestError(`Ticket of event with id ${this._eventId} doesn't exists is not selling.`));
                    return null;
                }
            }
            let venueId = event.venueId;
            await database_1.Database.mongodb.collection(priceTier_1.PriceTierDAO.collection_name).findOne({ _id: this._priceTierId }).then(instance => {
                if (instance == null) {
                    this.res.locals.RequestErrorList.push(new database_1.RequestError(`Price Tier with id ${this._priceTierId} doesn't exists.`));
                }
            });
            let seatDoc = await database_1.Database.mongodb.collection(seat_1.SeatDAO.collection_name).findOne({ _id: this._seatId, venueId: venueId }).then(instance => {
                if (instance == null) {
                    this.res.locals.RequestErrorList.push(new database_1.RequestError(`Seat with id ${this._seatId} in the same event venue with id ${venueId} doesn't exists.`));
                }
                return instance;
            });
            if (checkQuotaForUserId != undefined) {
                var count = await database_1.Database.mongodb.collection(TicketDAO.collection_name).aggregate([
                    { $match: { occupantId: checkQuotaForUserId, eventId: this.eventId } }, { $count: "baught" }
                ]).tryNext();
                if (count != null && Number.isInteger(count.baught)) {
                    let quota = (event.startFirstRoundSellDate <= new Date() && event.endFirstRoundSellDate >= new Date()) ?
                        event.firstRoundTicketQuota : (event.startSecondRoundSellDate <= new Date() && event.endSecondRoundSellDate >= new Date()) ?
                        event.secondRoundTicketQuota :
                        0;
                    if (quota > -1 && count.baught + purchaseQuantity > quota) {
                        this.res.locals.RequestErrorList.push(new database_1.RequestError(`You have no more ticket quota for this show.`));
                    }
                }
            }
            let userDoc = null;
            if (this._occupantId) {
                userDoc = await database_1.Database.mongodb.collection(user_1.UserDAO.collection_name).findOne({ _id: this._occupantId }).then(instance => {
                    if (instance == null) {
                        this.res.locals.RequestErrorList.push(new database_1.RequestError(`User with id ${this._seatId} doesn't exists.`));
                    }
                    return instance;
                });
            }
            return { seat: seatDoc, user: userDoc };
        }
        else {
            if (event == null)
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`Event with id ${this._eventId} doesn't exists.`));
            if (!checkIsSelling)
                return null;
            if (event.startFirstRoundSellDate == undefined || event.startFirstRoundSellDate > new Date())
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`The first round of ticket selling of event with id ${this._eventId} is not started yet.`));
            if (event.endFirstRoundSellDate == undefined || event.endFirstRoundSellDate < new Date())
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`The first round of selling of event with id ${this._eventId} was ended.`));
            if (event.startSecondRoundSellDate == undefined || event.startSecondRoundSellDate > new Date())
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`The second round of ticket selling of event with id ${this._eventId} is not started yet.`));
            if (event.endSecondRoundSellDate == undefined || event.endSecondRoundSellDate < new Date())
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`The second round of selling of event with id ${this._eventId} was ended.`));
            return null;
        }
    }
    async duplicationChecking() {
        await database_1.Database.mongodb.collection(TicketDAO.collection_name).findOne({ eventId: this.eventId, seatId: this.seatId }).then(instance => {
            if (instance) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`Ticket with same event with id ${this.eventId} and seat with id ${this.seatId} already exists.`));
            }
        });
    }
    async create() {
        return new Promise(async (resolve, reject) => {
            this.res.locals.session.startTransaction();
            try {
                await this.checkReference();
                await this.duplicationChecking();
            }
            catch (err) {
                reject(err);
                return;
            }
            var result = await database_1.Database.mongodb.collection(TicketDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session });
            if (result.insertedId) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
            }
        });
    }
    static async batchCreate(res, daos) {
        return new Promise((resolve, reject) => {
            res.locals.session.startTransaction();
            Promise.all(daos.map(dao => new Promise(async (daoresolve, daoreject) => {
                try {
                    await dao.checkReference();
                    await dao.duplicationChecking();
                }
                catch (err) {
                    daoreject(err);
                    return;
                }
                try {
                    var result = await database_1.Database.mongodb.collection(TicketDAO.collection_name).insertOne(dao.Serialize(true), { session: res.locals.session });
                    if (result && result.insertedId) {
                        daoresolve(dao);
                    }
                    else {
                        daoreject(new database_1.RequestError(`Creation of ${dao.constructor.name} failed with unknown reason.`));
                    }
                }
                catch (err) {
                    console.log(err);
                    reject(new database_1.RequestError(`Please reduce the size of your batch request.`));
                }
            }))).then(daos => {
                resolve(daos);
            });
        });
    }
    static async batchUdatePriceTier(res, daos, priceTierId) {
        return new Promise((resolve, reject) => {
            res.locals.session.startTransaction();
            Promise.all(daos.map(dao => new Promise(async (daoresolve, daoreject) => {
                try {
                    dao.priceTierId = new mongodb_1.ObjectId(priceTierId);
                    await dao.checkReference();
                }
                catch (err) {
                    daoreject(err);
                    return;
                }
                if (dao._id) {
                    try {
                        var result = await database_1.Database.mongodb.collection(TicketDAO.collection_name)
                            .updateOne({ _id: dao._id }, { $set: dao.Serialize(true) }, { session: res.locals.session });
                        if (result) {
                            daoresolve(dao);
                        }
                        else {
                            daoreject(new database_1.RequestError(`Update of ${dao.constructor.name} failed with unknown reason.`));
                        }
                    }
                    catch (err) {
                        console.log(err);
                        reject(new database_1.RequestError(`Please reduce the size of your batch request.`));
                    }
                }
                else {
                    reject(new database_1.RequestError(`One of the ticket's id is not initialized.`));
                }
            }))).then(daos => {
                resolve(daos);
            });
        });
    }
    async update() {
        return new Promise(async (resolve, reject) => {
            if (this._id == undefined) {
                reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                return;
            }
            try {
                await this.checkReference();
            }
            catch (err) {
                reject(err);
                return;
            }
            var result = await database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session });
            if (result.modifiedCount > 0) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
            }
        });
    }
    static async batchClaim(res, daos, userId) {
        return new Promise(async (resolve, reject) => {
            res.locals.session.startTransaction();
            let originalOccupant = await user_1.UserDAO.getById(res, userId).catch(err => reject(err));
            if (originalOccupant && originalOccupant.email) {
                Promise.all(daos.map(dao => new Promise(async (daoresolve, daoreject) => {
                    dao._occupantId = new mongodb_1.ObjectId(userId);
                    let info;
                    try {
                        info = await dao.checkReference(true, new mongodb_1.ObjectId(userId), daos.length);
                    }
                    catch (err) {
                        daoreject(err);
                        return;
                    }
                    if (dao.id) {
                        try {
                            var result = await database_1.Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: dao.id, occupantId: null }, { $set: { "occupantId": userId } }, { session: res.locals.session });
                            if (result && result.modifiedCount > 0) {
                                daoresolve({ dao: dao, info: info ? info : undefined });
                            }
                            else {
                                daoreject(new database_1.RequestError(`Ticket with id ${dao.id} is not avaliable.`));
                            }
                        }
                        catch (err) {
                            console.log(err);
                            reject(new database_1.RequestError(`Please reduce the size of your batch request.`));
                        }
                    }
                }))).then(async (ticketDaoWithInfo) => {
                    if (originalOccupant && originalOccupant.email) {
                        let notificationDao = new notification_1.NotificationDAO(res, {
                            title: "Ticket Purchased",
                            email: originalOccupant.email,
                            message: `Dear ${ticketDaoWithInfo[0].info?.user?.fullname}\n` +
                                `${ticketDaoWithInfo.length} ticket purchased:\n` +
                                ticketDaoWithInfo.map(withInfo => withInfo.info?.seat?.row + withInfo.info?.seat?.no).join(", ") +
                                `\nFor follow-up info, please visit: ${process.env.BASE_PRODUCTION_URI}/payment-info?`
                                + ticketDaoWithInfo.map(withInfo => 'ids=' + withInfo.dao._id?.toString()).join('&') + `&userId=${userId}`,
                            recipientId: userId
                        });
                        await notificationDao.create().catch(err => reject(err));
                        notificationDao.send().catch(err => console.log(err));
                    }
                    resolve(ticketDaoWithInfo.map(withInfo => withInfo.dao));
                });
            }
            else {
                if (originalOccupant instanceof Object && originalOccupant.email == undefined) {
                    reject(new database_1.RequestError(`User with id ${userId} has an occupant without email information.`));
                }
                if (originalOccupant)
                    reject(new database_1.RequestError(`User id ${userId} not found.`));
                return;
            }
        });
    }
    async delete() {
        return new Promise(async (resolve, reject) => {
            if (this._id == undefined) {
                reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                return;
            }
            var result = await database_1.Database.mongodb.collection(TicketDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) }, { session: this.res.locals.session });
            if (result.deletedCount > 0) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
            }
        });
    }
    static async batchDelete(res, daos) {
        return new Promise((resolve, reject) => {
            res.locals.session.startTransaction();
            Promise.all(daos.filter(dao => dao.id != undefined).map(dao => new Promise(async (daoresolve, daoreject) => {
                if (dao.occupantId != null) {
                    daoreject(new database_1.RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed as it has occupant.`));
                }
                try {
                    var result = await database_1.Database.mongodb.collection(TicketDAO.collection_name).deleteOne(dao.Serialize(true), { session: res.locals.session });
                    if (result && result.deletedCount > 0) {
                        daoresolve(dao);
                    }
                    else {
                        daoreject(new database_1.RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed with unknown reason.`));
                    }
                }
                catch (err) {
                    console.log(err);
                    reject(new database_1.RequestError(`Please reduce the size of your batch request.`));
                }
            }))).then(daos => {
                resolve(daos);
            });
        });
    }
}
exports.TicketDAO = TicketDAO;
