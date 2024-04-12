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
exports.Ticket = void 0;
const express_1 = require("express");
const ticket_1 = require("../dao/ticket");
const database_1 = require("../dao/database");
var Ticket;
(function (Ticket) {
    function RouterFactory() {
        var ticket = (0, express_1.Router)();
        ticket.use((req, res, next) => {
            var _a;
            if (req.method != 'PATH' && req.query.buy != undefined) {
                next();
            }
            else if (req.method != 'GET' && ((_a = req.session["user"]) === null || _a === void 0 ? void 0 : _a.hasAdminRight) != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        ticket.get("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (req.query.eventId && typeof req.query.eventId == "string") {
                ticket_1.TicketDAO.listByEventId(req.query.eventId, { showOccupant: (_a = req.session["user"]) === null || _a === void 0 ? void 0 : _a.hasAdminRight }).then(result => {
                    next({ success: true, data: result });
                }).catch((error) => next(error));
            }
            else if (req.query.my != undefined && req.session['user'] && req.session['user']._id) {
                ticket_1.TicketDAO.ofUser(req.session['user']._id, { showOccupant: (_b = req.session["user"]) === null || _b === void 0 ? void 0 : _b.hasAdminRight }).then(result => {
                    next({ success: true, data: result });
                }).catch((error) => next(error));
            }
            else if (req.query.sold != undefined) {
                ticket_1.TicketDAO.listSold({ showOccupant: (_c = req.session["user"]) === null || _c === void 0 ? void 0 : _c.hasAdminRight }).then(result => {
                    next({ success: true, data: result });
                }).catch((error) => next(error));
            }
            else if (req.query.list != undefined) {
                let ids;
                try {
                    ids = (JSON.parse(req.query.list)).filter((value) => typeof value == "string");
                }
                catch (e) {
                }
                if (ids) {
                    ticket_1.TicketDAO.listByIds(ids, Object.assign({ showOccupant: false }, req.session["user"] != null && req.session["user"]._id ? { checkIfBelongsToUser: req.session["user"]._id } : {})).then(result => {
                        next({ success: true, data: result });
                    }).catch((error) => next(error));
                }
                else {
                    next(new database_1.RequestError("unregconized list query"));
                }
            }
        }));
        ticket.get("/:ticketId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _d;
            ticket_1.TicketDAO.getWithDetailsById(req.params.ticketId, { showOccupant: (_d = req.session["user"]) === null || _d === void 0 ? void 0 : _d.hasAdminRight }).then(result => {
                next({ success: true, data: result });
            }).catch((error) => { next(error); });
        }));
        ticket.post("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.create != undefined) {
                if (req.query.batch != undefined && req.body.tickets && Array.isArray(req.body.tickets)) {
                    var daos = req.body.tickets.map((t) => {
                        var dao = new ticket_1.TicketDAO(res, {});
                        dao.eventId = t.eventId;
                        dao.seatId = t.seatId;
                        dao.priceTierId = t.priceTierId;
                        dao.paid = false;
                        return dao;
                    });
                    ticket_1.TicketDAO.batchCreate(res, daos).then((tickets) => {
                        next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) });
                    }).catch((error) => next(error));
                }
                else if (req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string") {
                    var dao = new ticket_1.TicketDAO(res, {});
                    dao.paid = false;
                    var promises = [];
                    dao.eventId = req.body.eventId;
                    dao.seatId = req.body.seatId;
                    dao.priceTierId = req.body.priceTierId;
                    dao.create().then((value) => {
                        next({ success: true });
                    }).catch((error) => next(error));
                }
            }
        }));
        ticket.patch("", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                if (req.query.buy != undefined) {
                    if (req.session['user'] && req.session['user']._id) {
                        ticket_1.TicketDAO.getByIds(res, req.body.ticketIds).then(daos => ticket_1.TicketDAO.batchClaim(res, daos, req.session['user']._id)).then((tickets) => {
                            next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) });
                        }).catch((error) => next(error));
                    }
                    else {
                        next(new database_1.RequestError("Buying ticket requires a user login"));
                    }
                }
                else if (typeof req.query.priceTier === "string") {
                    ticket_1.TicketDAO.getByIds(res, req.body.ticketIds).then(daos => {
                        if (typeof req.query.priceTier === "string") {
                            return ticket_1.TicketDAO.batchUdatePriceTier(res, daos, req.query.priceTier);
                        }
                        else {
                            next(new database_1.RequestError(`${req.query.priceTier} is not of type string`));
                            return [];
                        }
                    }).then((tickets) => {
                        next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) });
                    }).catch((error) => next(error));
                }
            }
        }));
        ticket.patch("/:ticketId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.buy != undefined) {
                if (req.session['user'] && req.session['user']._id) {
                    ticket_1.TicketDAO.getById(res, req.params.ticketId).then(dao => dao.claim(req.session['user']._id)).then((value) => {
                        next({ success: true });
                    }).catch((error) => next(error));
                }
                else {
                    next(new database_1.RequestError("Buying ticket requires a user login"));
                }
            }
            if (req.query.payment != undefined &&
                (req.body.paid != undefined || req.body.paid == null || typeof req.body.paid == "boolean") &&
                (req.body.paymentRemark == undefined || req.body.paymentRemark == null || typeof req.body.paymentRemark == "string") &&
                req.session['user'] && req.session['user']._isAdmin) {
                ticket_1.TicketDAO.getById(res, req.params.ticketId).then(dao => {
                    dao.paid = req.body.paid;
                    dao.paymentRemark = req.body.paymentRemark;
                    return dao.update();
                }).then((value) => {
                    next({ success: true });
                }).catch((error) => next(error));
            }
            else if (req.query.void != undefined) {
                ticket_1.TicketDAO.getById(res, req.params.ticketId).then(dao => dao.void()).then((value) => {
                    next({ success: true });
                }).catch((error) => next(error));
            }
        }));
        ticket.delete("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                ticket_1.TicketDAO.getByIds(res, req.body.ticketIds).then(daos => ticket_1.TicketDAO.batchDelete(res, daos)).then((tickets) => {
                    next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) });
                }).catch((error) => next(error));
            }
        }));
        ticket.delete("/:ticketId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            ticket_1.TicketDAO.getById(res, req.params.ticketId).then(dao => dao.delete()).then((value) => {
                next({ success: true });
            }).catch((error) => { next(error); });
        }));
        return ticket;
    }
    Ticket.RouterFactory = RouterFactory;
    ;
})(Ticket = exports.Ticket || (exports.Ticket = {}));
