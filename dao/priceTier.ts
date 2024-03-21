import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, WithId, Document, ObjectId } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./api";

export namespace PriceTier {
    export const collection_name = "priceTiers"
    export function RouterFactory(): Express.Router {
        var priceTier = Router()

        priceTier.get("/", (req: Request, res: Response) => {
            if (req.query.list != undefined) {
                var cursor = Database.mongodb.collection(collection_name).find()
                let result: Object[] = []
                cursor.forEach(doc => {
                    result.push(doc)
                }).then(_ => {
                    res.json({ success: true, data: result })
                })

            }
        })

        priceTier.get("/:priceTierId", (req: Request, res: Response) => {

        })

        priceTier.post("/", async (req: Request, res: Response) => {
            if (req.query.create != undefined) {
                if (req.body.tierName && req.body.price) {
                    var dao = new DAO({
                        tierName: req.body.tierName,
                        price: req.body.price,
                    })
                    return Database.mongodb.collection(collection_name).insertOne(dao.Serialize(true)).then((value) => {
                        if (value.insertedId) {
                            res.json({ success: true })
                        }
                    })
                }
            }
        })

        priceTier.patch("/:priceTierId", async (req: Request, res: Response) => {
            if (req.body.tierName && req.body.price) {
                var dao = new DAO({
                    tierName: req.body.tierName,
                    price: req.body.price,
                })
                return Database.mongodb.collection(collection_name).updateOne({ _id: new ObjectId(req.params.priceTierId) }, { $set: dao.Serialize(true) },).then((value) => {
                    if (value.modifiedCount > 0) {
                        res.json({ success: true })
                    }
                })
            }
        })

        priceTier.delete("/:priceTierId", async (req: Request, res: Response) => {
            return Database.mongodb.collection(collection_name).deleteOne({ _id: new ObjectId(req.params.priceTierId) }).then((value) => {
                if (value.deletedCount > 0) {
                    res.json({ success: true })
                }
            })
        })

        return priceTier
    };
    export class DAO extends BaseDAO {
        private _tierName: string | undefined
        public get tierName() { return this._tierName }
        public set tierName(value: string | undefined) { this._tierName = value; BaseDAO.DirtyList.add(this); }


        private _price: number | undefined
        public get price() { return this._price }
        public set price(value: number | undefined) {
            if (value && value < 0) {
                throw new RequestError('Price must be greater then 0.')
            }
            else {
                this._price = value; BaseDAO.DirtyList.add(this);
            }
        }

        constructor(params: { tierName?: string, price?: number } & { doc?: WithId<Document> }) {
            super(params.doc && params.doc._id ? params.doc._id : undefined);
            if (params.doc && params.doc._id) {
                this._tierName = params.doc.tierName
                this._price = params.doc.price
            }
            if (params.tierName) this.tierName = params.tierName
            if (params.price) this.price = params.price
        }
    }
}