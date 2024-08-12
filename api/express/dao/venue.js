"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueDAO = exports.sectionTypeCheck = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../database");
const dao_1 = require("./dao");
const seat_1 = require("./seat");
const event_1 = require("./event");
function sectionTypeCheck(s) {
    return typeof s.x == "number" &&
        typeof s.y == "number";
}
exports.sectionTypeCheck = sectionTypeCheck;
class VenueDAO extends dao_1.BaseDAO {
    static collection_name = "venues";
    _sections;
    get sections() { return this._sections; }
    set sections(value) { this._sections = value; }
    _venuename;
    get venuename() { return this._venuename; }
    set venuename(value) { this._venuename = value; }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._venuename = params.doc.venuename;
            this._sections = params.doc.sections;
        }
        if (params.venuename)
            this.venuename = params.venuename;
        if (params.sections)
            this.sections = params.sections;
    }
    static async listAll(res) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(VenueDAO.collection_name).find();
            resolve((await cursor.toArray()).map(doc => new VenueDAO(res, { doc: doc })));
        });
    }
    static async getById(res, id) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
            if (doc) {
                resolve(new VenueDAO(res, { doc: doc }));
            }
            reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
        });
    }
    async create() {
        return new Promise(async (resolve, reject) => {
            var result = await database_1.Database.mongodb.collection(VenueDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session });
            if (result.insertedId) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
            }
        });
    }
    async checkSeatSectionDependency() {
        let seat;
        if (this._id && this.sections) {
            seat = await database_1.Database.mongodb.collection(seat_1.SeatDAO.collection_name).findOne({
                venueId: this._id,
                $nor: this.sections.map(s => {
                    return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] };
                })
            });
        }
        return seat;
    }
    async update() {
        return new Promise(async (resolve, reject) => {
            if (this._id) {
                var dependency = await this.checkSeatSectionDependency();
                if (dependency) {
                    reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed ` +
                        `as seat  with id ${dependency._id} depends on section ${dependency.coord.sectX}-${dependency.coord.sectY}.`));
                    return;
                }
                var result = await database_1.Database.mongodb.collection(VenueDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session });
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
    async checkDependency() {
        var seat = await database_1.Database.mongodb.collection(seat_1.SeatDAO.collection_name).findOne({ venueId: this._id });
        var event = await database_1.Database.mongodb.collection(event_1.EventDAO.collection_name).findOne({ venueId: this._id });
        return { seat: seat, event: event };
    }
    async delete() {
        return new Promise(async (resolve, reject) => {
            this.res.locals.session.startTransaction();
            var dependency = await this.checkDependency();
            if (dependency.event != null || dependency.seat != null) {
                var dependencyType = dependency.event != null ? "event" : "seat";
                var dependencyId = dependency.event != null ? dependency.event._id : dependency.seat?._id;
                reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ${dependencyType}  with id ${dependencyId} depends on it.`));
                return;
            }
            if (this._id) {
                var result = await database_1.Database.mongodb.collection(VenueDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) }, { session: this.res.locals.session });
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
exports.VenueDAO = VenueDAO;
