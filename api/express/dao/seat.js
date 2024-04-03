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
    get row() { return this._row; }
    set row(value) { this._row = value; }
    get no() { return this._no; }
    set no(value) { this._no = value; }
    get coord() { return this._coord; }
    set coord(value) {
        if (value && coordTypeCheck(value)) {
            this._coord = value;
        }
    }
    get venueId() { return this._venueId; }
    set venueId(value) {
        this._venueId = new mongodb_1.ObjectId(value);
    }
    constructor(params) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
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
    static listByVenueId(venueId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(SeatDAO.collection_name).find({ venueId: new mongodb_1.ObjectId(venueId) });
                resolve((yield cursor.toArray()).map(doc => new SeatDAO({ doc: doc })));
            }));
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var doc = yield database_1.Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                if (doc) {
                    resolve(new SeatDAO({ doc: doc }));
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
                        var doc = yield database_1.Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                        if (doc) {
                            daoresolve(new SeatDAO({ doc: doc }));
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
            yield database_1.Database.mongodb.collection(venue_1.VenueDAO.collection_name).findOne({ _id: this._venueId }).then(instance => {
                var _a, _b;
                if (instance == null) {
                    dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Venue with id ${this._venueId} doesn't exists.`));
                }
                else if (instance.sections.filter((s) => { var _a, _b; return s.x == ((_a = this.coord) === null || _a === void 0 ? void 0 : _a.sectX) && s.y == ((_b = this.coord) === null || _b === void 0 ? void 0 : _b.sectY); }).length == 0) {
                    dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Venue with id ${this._venueId} doesn't contain section ${(_a = this.coord) === null || _a === void 0 ? void 0 : _a.sectX}-${(_b = this.coord) === null || _b === void 0 ? void 0 : _b.sectY}.`));
                }
            });
        });
    }
    duplicationChecking() {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.Database.mongodb.collection(SeatDAO.collection_name).findOne({ venueId: this.venueId, no: this.no, row: this.row }).then(instance => {
                if (instance) {
                    dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError(`Seat in the same venue with id ${this.venueId} at row ${this.row} with no ${this.no} already exists.`));
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
                catch (error) {
                    reject(error);
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(SeatDAO.collection_name).insertOne(this.Serialize(true));
                if (result.insertedId) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
                    return;
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
                    var result = yield database_1.Database.mongodb.collection(SeatDAO.collection_name).insertOne(dao.Serialize(true));
                    if (result.insertedId) {
                        daoresolve(dao);
                    }
                    else {
                        daoreject(new database_1.RequestError(`Creation of ${dao.constructor.name} failed with unknown reason.`));
                        return;
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
                    yield this.duplicationChecking();
                }
                catch (err) {
                    reject(err);
                    return;
                }
                var result = yield database_1.Database.mongodb.collection(SeatDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) });
                if (result.modifiedCount > 0) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
                }
            }));
        });
    }
    checkTicketDependency() {
        return __awaiter(this, void 0, void 0, function* () {
            var ticket = yield database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).findOne({ priceTier_id: this._id });
            return ticket;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                database_1.Database.session.startTransaction();
                var dependency = yield this.checkTicketDependency();
                if (dependency != null) {
                    reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                        `as ticket with id ${dependency._id} depends on it.`));
                    return;
                }
                if (this._id) {
                    var result = yield database_1.Database.mongodb.collection(SeatDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) });
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
    static batchDelete(daos) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                database_1.Database.session.startTransaction();
                Promise.all(daos.filter(dao => dao.id != undefined).map(dao => new Promise((daoresolve, daoreject) => __awaiter(this, void 0, void 0, function* () {
                    var dependency = yield dao.checkTicketDependency();
                    if (dependency != null) {
                        reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${dao._id} failed ` +
                            `as ticket with id ${dependency._id} depends on it.`));
                        return;
                    }
                    var result = yield database_1.Database.mongodb.collection(SeatDAO.collection_name).deleteOne(dao.Serialize(true));
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
exports.SeatDAO = SeatDAO;
SeatDAO.collection_name = "seats";
