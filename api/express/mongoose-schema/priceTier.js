"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceTierDAO = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const dao_1 = require("./dao");
const ticket_1 = require("./ticket");
class PriceTierDAO extends dao_1.BaseDAO {
    static collection_name = "priceTiers";
    _tierName;
    get tierName() { return this._tierName; }
    set tierName(value) { this._tierName = value; }
    _price;
    get price() { return this._price; }
    set price(value) {
        if (value && value < 0) {
            this.res.locals.RequestErrorList.push(new database_1.RequestError('Price must be greater then 0.'));
        }
        else {
            this._price = value;
        }
    }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._tierName = params.doc.tierName;
            this._price = params.doc.price;
        }
        if (params.tierName)
            this.tierName = params.tierName;
        if (params.price)
            this.price = params.price;
    }
    static async listAll(res) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(PriceTierDAO.collection_name).find();
            resolve((await cursor.toArray()).map(doc => new PriceTierDAO(res, { doc: doc })));
        });
    }
    static async getById(res, id) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(PriceTierDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) });
            if (doc) {
                resolve(new PriceTierDAO(res, { doc: doc }));
            }
            reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
        });
    }
    async create() {
        return new Promise(async (resolve, reject) => {
            var result = await database_1.Database.mongodb.collection(PriceTierDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session });
            if (result.insertedId) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`));
            }
        });
    }
    async update() {
        return new Promise(async (resolve, reject) => {
            if (this._id) {
                var result = await database_1.Database.mongodb.collection(PriceTierDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session });
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
        var ticket = await database_1.Database.mongodb.collection(ticket_1.TicketDAO.collection_name).findOne({ priceTierId: this._id });
        return ticket;
    }
    async delete() {
        return new Promise(async (resolve, reject) => {
            var dependency = await this.checkTicketDependency();
            if (dependency != null) {
                reject(new database_1.RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on it.`));
                return;
            }
            if (this._id) {
                var result = await database_1.Database.mongodb.collection(PriceTierDAO.collection_name).deleteOne({ _id: new mongodb_1.ObjectId(this._id) }, { session: this.res.locals.session });
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
exports.PriceTierDAO = PriceTierDAO;
