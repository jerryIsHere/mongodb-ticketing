import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database } from "../dao/database";
import { UserDAO } from "../dao/user";
import { EventDAO } from "../dao/event";
import { SeatDAO } from "../dao/seat";
import { VenueDAO } from "../dao/venue";
import { PriceTierDAO } from "../dao/priceTier";
import { TicketDAO } from "../dao/ticket";
declare module "express-session" {
    interface SessionData {
        user: UserDAO | null;
    }
}

export namespace Admin {
    export function RouterFactory(): Express.Router {
        var admin = Router()

        admin.use((req: Request, res: Response, next) => {
            if ((req.session["user"] as any)?._isAdmin != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        var db = Database.mongo.db(Database.db_name)
        admin.get("/initMongoDB", async (req: Request, res: Response, next) => {
            [UserDAO, EventDAO, SeatDAO, VenueDAO, PriceTierDAO, TicketDAO].forEach((namespace) => {
                if (namespace.collection_name) {
                    Database.mongodb.createCollection(namespace.collection_name)
                }
            })
            next({ success: true });
        })
        return admin
    };
}
