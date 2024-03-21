import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId, WithId, Document } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database } from "./api";

export namespace Venue {
    export const collection_name = "venues"
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.get("/", (req: Request, res: Response) => {
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
        venue.get("/:venueId", async (req: Request, res: Response) => {

        })

        venue.post("/", async (req: Request, res: Response) => {
            if (req.query.create != undefined) {
                var dao = new DAO({
                    venuename: req.body.venuename
                })
                return Database.mongodb.collection(collection_name).insertOne(dao.Serialize(true)).then((value) => {
                    if (value.acknowledged) {
                        res.json({ success: true })
                    }
                })
            }
        })

        venue.patch("/:venueId", async (req: Request, res: Response) => {
            var dao = new DAO({
                venuename: req.body.venuename
            })
            Database.mongodb.collection(collection_name).updateOne({ _id: new ObjectId(req.params.priceTierId) }, { $set: dao.Serialize(true) },).then((value) => {
                if (value.acknowledged) {
                    res.json({ success: true })
                }
            })

        })

        venue.delete("/:venueId", async (req: Request, res: Response) => {
            return Database.mongodb.collection(collection_name).deleteOne({ _id: new ObjectId(req.params.venueId) }).then((value) => {
                if (value.acknowledged) {
                    res.json({ success: true })
                }
            })
        })
        return venue
    };
    export class DAO extends BaseDAO {
        private _venuename: string | undefined
        public get venuename() { return this._venuename }
        public set venuename(value: string | undefined) { this._venuename = value; BaseDAO.DirtyList.add(this); }

        constructor(params: { venuename: string } & { doc?: WithId<Document> }) {
            super(params.doc && params.doc._id ? params.doc._id : undefined);
            if (params.doc && params.doc._id) {
                this._venuename = params.doc.venuename
            }
            if (params.venuename)
                this.venuename = params.venuename
        }
    }
}