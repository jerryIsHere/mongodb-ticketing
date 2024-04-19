"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatDAO = exports.coordTypeCheck = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const dao_1 = require("./dao");
const venue_1 = require("./venue");
const ticket_1 = require("./ticket");
function coordTypeCheck(c) {
    return c && typeof c.orderInRow == "number" &&
        typeof c.sectX == "number" &&
        typeof c.sectY == "number";
}
exports.coordTypeCheck = coordTypeCheck;
class SeatDAO extends dao_1.BaseDAO {
    static collection_name = "seats";
    _row;
    get row() { return this._row; }
    set row(value) { this._row = value; }
    _no;
    get no() { return this._no; }
    set no(value) { this._no = value; }
    _coord;
    get coord() { return this._coord; }
    set coord(value) {
        if (value && coordTypeCheck(value)) {
            this._coord = value;
        }
    }
    _venueId;
    get venueId() { return this._venueId; }
    set venueId(value) {
        this._venueId = new mongodb_1.ObjectId(value);
    }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._row = params.doc.row;
            this._no = params.doc.no;
            this._venueId = params.doc.venueId;
            this._coord = params.doc.coord;
        }
        if (params.row)
            this.row = params.row;
        if (params.no)
            this.no = params.no;
        if (params.coord)
            this.coord = params.coord;
    }
    static async listByVenueId(res, venueId) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(SeatDAO.collection_name).find({ venueId: new mongodb_1.ObjectId(venueId) });
            resolve((await cursor.toArray()).map(doc => new SeatDAO(res, { doc: doc })));
        });
    }
    static async getById(res, id) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
            if (doc) {
                resolve(new SeatDAO(res, { doc: doc }));
            }
            reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
        });
    }
    static async getByIds(res, ids) {
        return new Promise(async (resolve, reject) => {
            Promise.all(ids.map(async (id) => new Promise(async (daoresolve, daoreject) => {
                var doc = await database_1.Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                if (doc) {
                    daoresolve(new SeatDAO(res, { doc: doc }));
                }
                daoreject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }))).then(daos => {
                resolve(daos);
            });
        });
    }
    async checkReference() {
        await database_1.Database.mongodb.collection(venue_1.VenueDAO.collection_name).findOne({ _id: this._venueId }).then(instance => {
            if (instance == null) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`Venue with id ${this._venueId} doesn't exists.`));
            }
            else if (instance.sections.filter((s) => s.x == this.coord?.sectX && s.y == this.coord?.sectY).length == 0) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`Venue with id ${this._venueId} doesn't contain section ${this.coord?.sectX}-${this.coord?.sectY}.`));
            }
        });
    }
    async duplicationChecking() {
        await database_1.Database.mongodb.collection(SeatDAO.collection_name).findOne({ venueId: this.venueId, no: this.no, row: this.row }).then(instance => {
            if (instance) {
                this.res.locals.RequestErrorList.push(new database_1.RequestError(`Seat in the same venue with id ${this.venueId} at row ${this.row} with no ${this.no} already exists.`));
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
            catch (error) {
                reject(error);
                return;
            }
            var result = await database_1.Database.mongodb.collection(SeatDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session });
            if (result.insertedId) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
                return;
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
                    var result = await database_1.Database.mongodb.collection(SeatDAO.collection_name).insertOne(dao.Serialize(true), { session: res.locals.session });
                    if (result && result.insertedId) {
                        daoresolve(dao);
                    }
                    else {
                        daoreject(new database_1.RequestError(`Creation of ${dao.constructor.name} failed with unknown reason.`));
                        return;
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
    async update() {
        return new Promise(async (resolve, reject) => {
            if (this._id == undefined) {
                reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                return;
            }
            try {
                await this.checkReference();
                await this.duplicationChecking();
            }
            catch (err) {
                reject(err);
                return;
            }
            var result = await database_1.Database.mongodb.collection(SeatDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session });
            if (result.modifiedCount > 0) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
            }
        });
    }
    async checkTicketDependency() {
        var ticket = await database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).findOne({ priceTier_id: this._id });
        return ticket;
    }
    async delete() {
        return new Promise(async (resolve, reject) => {
            this.res.locals.session.startTransaction();
            var dependency = await this.checkTicketDependency();
            if (dependency != null) {
                reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on it.`));
                return;
            }
            if (this._id) {
                var result = await database_1.Database.mongodb.collection(SeatDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) }, { session: this.res.locals.session });
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
    static async batchDelete(res, daos) {
        return new Promise((resolve, reject) => {
            res.locals.session.startTransaction();
            Promise.all(daos.filter(dao => dao.id != undefined).map(dao => new Promise(async (daoresolve, daoreject) => {
                var dependency = await dao.checkTicketDependency();
                if (dependency != null) {
                    reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${dao._id} failed ` +
                        `as ticket with id ${dependency._id} depends on it.`));
                    return;
                }
                try {
                    var result = await database_1.Database.mongodb.collection(SeatDAO.collection_name).deleteOne(dao.Serialize(true), { session: res.locals.session });
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
exports.SeatDAO = SeatDAO;
