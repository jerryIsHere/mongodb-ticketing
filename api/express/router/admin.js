"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const user_1 = require("../dao/user");
const event_1 = require("../dao/event");
const seat_1 = require("../dao/seat");
const venue_1 = require("../dao/venue");
const priceTier_1 = require("../dao/priceTier");
const ticket_1 = require("../dao/ticket");
var Admin;
(function (Admin) {
    function RouterFactory() {
        var admin = (0, express_1.Router)();
        admin.use((req, res, next) => {
            if (req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        var db = database_1.Database.mongo.db(database_1.Database.db_name);
        admin.get("/initMongoDB", async (req, res, next) => {
            [user_1.UserDAO, event_1.EventDAO, seat_1.SeatDAO, venue_1.VenueDAO, priceTier_1.PriceTierDAO, ticket_1.TicketDAO].forEach((namespace) => {
                if (namespace.collection_name) {
                    database_1.Database.mongodb.createCollection(namespace.collection_name);
                }
            });
            next({ success: true });
        });
        return admin;
    }
    Admin.RouterFactory = RouterFactory;
    ;
})(Admin = exports.Admin || (exports.Admin = {}));
