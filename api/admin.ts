import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database } from "../dao/database";
import { UserDAO } from "../dao/user";
import { EventDAO } from "../dao/event";
import { SeatDAO } from "../dao/seat";
import { VenueDAO } from "../dao/venue";
import { PriceTierDAO } from "../dao/priceTier";
import { TicketDAO } from "../dao/ticket";

export namespace Admin {
    export function RouterFactory(): Express.Router {
        var admin = Router()
        var db = Database.mongo.db(Database.db_name)
        admin.get("/initMongoDB", async (req: Request, res: Response, next) => {
            [UserDAO, EventDAO, SeatDAO, VenueDAO, PriceTierDAO, TicketDAO].forEach((namespace) => {
                if (namespace.collection_name) {
                    Database.mongodb.createCollection(namespace.collection_name)
                }
            })
            res.json({ success: true });
        })
        return admin
    };
}
