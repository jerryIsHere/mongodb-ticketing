import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient } from "mongodb";
import { Config } from "./config";

import { User } from './user';

import { Event } from './event';

import { Seat } from './seat';

import { Venue } from './venue';

import { PriceTier } from './priceTier';

import { EventSeat } from "./eventSeat";

import { Database } from "./api";

export namespace Admin {
    export function RouterFactory(): Express.Router {
        var admin = Router()
        var db = Database.mongo.db(Config.db_name)
        admin.get("/initMongoDB", (req: Request, res: Response) => {
            [User, Event, Seat, Venue, PriceTier, EventSeat].forEach(namespace => {
                if (namespace.collection_name) {
                    Database.mongodb.createCollection(namespace.collection_name)
                }
            })
            res.json({ success: true });
        })
        return admin
    };
}
