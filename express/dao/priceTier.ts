import { WithId, Document, ObjectId } from "mongodb";
import { Database, RequestError } from "../database";
import { BaseDAO } from "./dao";
import { TicketDAO } from "./ticket";
import { Response } from "express";


export class PriceTierDAO extends BaseDAO {
    public static readonly collection_name = "priceTiers"
    private _tierName: string | undefined
    public get tierName() { return this._tierName }
    public set tierName(value: string | undefined) { this._tierName = value; }


    private _price: number | undefined
    public get price() { return this._price }
    public set price(value: number | undefined) {
        if (value && value < 0) {
            this.res.locals.RequestErrorList.push(new RequestError('Price must be greater then 0.'))
        }
        else {
            this._price = value;
        }
    }

    constructor(
        res: Response, params: { tierName?: string, price?: number } & { doc?: WithId<Document> }) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._tierName = params.doc.tierName
            this._price = params.doc.price
        }
        if (params.tierName) this.tierName = params.tierName
        if (params.price) this.price = params.price
    }
    static async listAll(
        res: Response,) {
        return new Promise<PriceTierDAO[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(PriceTierDAO.collection_name).find()
            resolve((await cursor.toArray()).map(doc => new PriceTierDAO(res, { doc: doc })));
        })
    }
    static async getById(
        res: Response, id: string) {

        return new Promise<PriceTierDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(PriceTierDAO.collection_name).findOne({ _id: new ObjectId(id) })
            if (doc) {
                resolve(new PriceTierDAO(res, { doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }

    async create(): Promise<PriceTierDAO> {
        return new Promise<PriceTierDAO>(async (resolve, reject) => {
            var result = await Database.mongodb.collection(PriceTierDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session })
            if (result.insertedId) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
            }
        })
    }

    async update(): Promise<PriceTierDAO> {
        return new Promise<PriceTierDAO>(async (resolve, reject) => {
            if (this._id) {
                var result = await Database.mongodb.collection(PriceTierDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session })
                if (result.modifiedCount > 0) {
                    resolve(this)
                }
                else {
                    reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
                }
            } else { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)) }
        })
    }
    async checkTicketDependency() {
        var ticket = await Database.mongodb.collection(TicketDAO.collection_name).findOne({ priceTierId: this._id })
        return ticket
    }
    async delete(): Promise<PriceTierDAO> {
        return new Promise<PriceTierDAO>(async (resolve, reject) => {
            var dependency = await this.checkTicketDependency()
            if (dependency != null) {
                reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on it.`)); return
            }
            if (this._id) {
                var result = await Database.mongodb.collection(PriceTierDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) }, { session: this.res.locals.session })
                if (result.deletedCount > 0) {

                    resolve(this)
                }
            }
            else { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
        })
    }
}
