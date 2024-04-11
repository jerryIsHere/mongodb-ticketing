"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = void 0;
const express_1 = require("express");
const database_1 = require("../dao/database");
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
            var _a;
            if (((_a = req.session["user"]) === null || _a === void 0 ? void 0 : _a.hasAdminRight) != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        var db = database_1.Database.mongo.db(database_1.Database.db_name);
        admin.get("/initMongoDB", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            [user_1.UserDAO, event_1.EventDAO, seat_1.SeatDAO, venue_1.VenueDAO, priceTier_1.PriceTierDAO, ticket_1.TicketDAO].forEach((namespace) => {
                if (namespace.collection_name) {
                    database_1.Database.mongodb.createCollection(namespace.collection_name);
                }
            });
            next({ success: true });
        }));
        return admin;
    }
    Admin.RouterFactory = RouterFactory;
    ;
})(Admin = exports.Admin || (exports.Admin = {}));
