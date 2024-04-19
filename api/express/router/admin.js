import { Router } from "express";
import { Database } from "../dao/database";
import { UserDAO } from "../dao/user";
import { EventDAO } from "../dao/event";
import { SeatDAO } from "../dao/seat";
import { VenueDAO } from "../dao/venue";
import { PriceTierDAO } from "../dao/priceTier";
import { TicketDAO } from "../dao/ticket";
export var Admin;
(function (Admin) {
    function RouterFactory() {
        var admin = Router();
        admin.use((req, res, next) => {
            if (req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        var db = Database.mongo.db(Database.db_name);
        admin.get("/initMongoDB", async (req, res, next) => {
            [UserDAO, EventDAO, SeatDAO, VenueDAO, PriceTierDAO, TicketDAO].forEach((namespace) => {
                if (namespace.collection_name) {
                    Database.mongodb.createCollection(namespace.collection_name);
                }
            });
            next({ success: true });
        });
        return admin;
    }
    Admin.RouterFactory = RouterFactory;
    ;
})(Admin || (Admin = {}));
