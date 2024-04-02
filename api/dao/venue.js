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
exports.VenueDAO = exports.sectionTypeCheck = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const dao_1 = require("./dao");
const seat_1 = require("./seat");
const event_1 = require("./event");
function sectionTypeCheck(s) {
    return typeof s.x == "number" &&
        typeof s.y == "number";
}
exports.sectionTypeCheck = sectionTypeCheck;
class VenueDAO extends dao_1.BaseDAO {
    get sections() { return this._sections; }
    set sections(value) { this._sections = value; }
    get venuename() { return this._venuename; }
    set venuename(value) { this._venuename = value; }
    constructor(params) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._venuename = params.doc.venuename;
            this._sections = params.doc.sections;
        }
        if (params.venuename)
            this.venuename = params.venuename;
        if (params.sections)
            this.sections = params.sections;
    }
    static listAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(VenueDAO.collection_name).find();
                resolve((yield cursor.toArray()).map(doc => new VenueDAO({ doc: doc })));
            }));
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var doc = yield database_1.Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                if (doc) {
                    resolve(new VenueDAO({ doc: doc }));
                }
                reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }));
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var result = yield database_1.Database.mongodb.collection(VenueDAO.collection_name).insertOne(this.Serialize(true));
                if (result.insertedId) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
                }
            }));
        });
    }
    checkSeatSectionDependency() {
        return __awaiter(this, void 0, void 0, function* () {
            let seat;
            if (this._id && this.sections) {
                seat = yield database_1.Database.mongodb.collection(seat_1.SeatDAO.collection_name).findOne({
                    venueId: this._id,
                    $nor: this.sections.map(s => {
                        return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] };
                    })
                });
            }
            return seat;
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this._id) {
                    var dependency = yield this.checkSeatSectionDependency();
                    if (dependency) {
                        reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed ` +
                            `as seat  with id ${dependency._id} depends on section ${dependency.coord.sectX}-${dependency.coord.sectY}.`));
                        return;
                    }
                    var result = yield database_1.Database.mongodb.collection(VenueDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) });
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
    checkDependency() {
        return __awaiter(this, void 0, void 0, function* () {
            var seat = yield database_1.Database.mongodb.collection(seat_1.SeatDAO.collection_name).findOne({ venueId: this._id });
            var event = yield database_1.Database.mongodb.collection(event_1.EventDAO.collection_name).findOne({ venueId: this._id });
            return { seat: seat, event: event };
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                database_1.Database.session.startTransaction();
                var dependency = yield this.checkDependency();
                if (dependency.event != null || dependency.seat != null) {
                    var dependencyType = dependency.event != null ? "event" : "seat";
                    var dependencyId = dependency.event != null ? dependency.event._id : (_a = dependency.seat) === null || _a === void 0 ? void 0 : _a._id;
                    reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                        `as ${dependencyType}  with id ${dependencyId} depends on it.`));
                    return;
                }
                if (this._id) {
                    var result = yield database_1.Database.mongodb.collection(VenueDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) });
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
exports.VenueDAO = VenueDAO;
VenueDAO.collection_name = "venues";
