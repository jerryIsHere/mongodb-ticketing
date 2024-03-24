import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient } from "mongodb";

import DAO, { BaseDAO } from '../dao/dao'
import { Database } from "../dao/database";

export namespace Admin {
    export function RouterFactory(): Express.Router {
        var admin = Router()
        var db = Database.mongo.db(Database.db_name)
        admin.get("/initMongoDB", (req: Request, res: Response) => {
            [DAO.User, EventDAO, DAO.Seat, DAO.Venue, DAO.PriceTier, EventSeatDAO].forEach((namespace) => {
                if (namespace.collection_name) {
                    Database.mongodb.createCollection(namespace.collection_name)
                }
            })
            res.json({ success: true });
        })
        return admin
    };
}
