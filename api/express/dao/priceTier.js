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
exports.PriceTierDAO = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const dao_1 = require("./dao");
const ticket_1 = require("./ticket");
class PriceTierDAO extends dao_1.BaseDAO {
    get tierName() { return this._tierName; }
    set tierName(value) { this._tierName = value; }
    get price() { return this._price; }
    set price(value) {
        if (value && value < 0) {
            dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError('Price must be greater then 0.'));
        }
        else {
            this._price = value;
        }
    }
    constructor(params) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._tierName = params.doc.tierName;
            this._price = params.doc.price;
        }
        if (params.tierName)
            this.tierName = params.tierName;
        if (params.price)
            this.price = params.price;
    }
    static listAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var cursor = database_1.Database.mongodb.collection(PriceTierDAO.collection_name).find();
                resolve((yield cursor.toArray()).map(doc => new PriceTierDAO({ doc: doc })));
            }));
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var doc = yield database_1.Database.mongodb.collection(PriceTierDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
                if (doc) {
                    resolve(new PriceTierDAO({ doc: doc }));
                }
                reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
            }));
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var result = yield database_1.Database.mongodb.collection(PriceTierDAO.collection_name).insertOne(this.Serialize(true));
                if (result.insertedId) {
                    resolve(this);
                }
                else {
                    reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
                }
            }));
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this._id) {
                    var result = yield database_1.Database.mongodb.collection(PriceTierDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) });
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
            var ticket = yield database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).findOne({ priceTierId: this._id });
            return ticket;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var dependency = yield this.checkTicketDependency();
                if (dependency != null) {
                    reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                        `as ticket with id ${dependency._id} depends on it.`));
                    return;
                }
                if (this._id) {
                    var result = yield database_1.Database.mongodb.collection(PriceTierDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) });
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
exports.PriceTierDAO = PriceTierDAO;
PriceTierDAO.collection_name = "priceTiers";
