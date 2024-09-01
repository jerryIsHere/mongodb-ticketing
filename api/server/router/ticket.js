"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = void 0;
const express_1 = require("express");
const database_1 = require("../database/database");
const mongodb_1 = require("mongodb");
const ticket_1 = require("../../mongoose-schema/v1/ticket");
let ticketNotFound = (id) => { throw new database_1.RequestError(`Ticket with id ${id} not found.`); };
var Ticket;
(function (Ticket) {
    function RouterFactory() {
        var ticket = (0, express_1.Router)();
        var InferPopulateType = (req) => {
            let session = req.session;
            if (session && session.user && (session.user.hasAdminRight || session.user.isCustomerSupport)) {
                if (req.query.populate == "full") {
                    return "full";
                }
                else {
                    return "none";
                }
            }
            return "none";
        };
        ticket.use((req, res, next) => {
            if (req.method == 'PATCH' && req.query.buy != undefined) {
                return next();
            }
            if (req.method == 'PATCH' && (req.query.void != undefined || req.query.verify != undefined) && req.session["user"]?.isCustomerSupport == true) {
                return next();
            }
            else if (req.method != 'GET' && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        ticket.get("/", async (req, res, next) => {
            let populateType = InferPopulateType(req);
            if (req.query.eventId && typeof req.query.eventId == "string" && req.query.sold == undefined) {
                ticket_1.ticketModel.aggregate((0, ticket_1.lookupQuery)({
                    $match: {
                        eventId: new mongodb_1.ObjectId(req.query.eventId)
                    }
                }, { populateType: populateType })).
                    then(async (docs) => next({
                    success: true, data: docs
                })).
                    catch(err => next(err));
            }
            else if (req.query.my != undefined && req.session['user'] && req.session['user']._id) {
                let userId = req.session['user']._id;
                ticket_1.ticketModel.aggregate([...(0, ticket_1.lookupQuery)({
                        $match: {
                            "purchaseInfo.purchaserId": new mongodb_1.ObjectId(userId)
                        }
                    }, { populateType: "purchaser", checkIfBelongsToUser: userId }),
                    {
                        $sort: {
                            "event.datetime": -1,
                            "priceTier.price": -1,
                            "seat.row": -1,
                            "seat.no": -1,
                        }
                    }]).
                    then(async (tickets) => next({
                    success: true,
                    data: tickets
                })).
                    catch(err => next(err));
            }
            else if (req.query.sold != undefined) {
                let populateType = InferPopulateType(req);
                let eventId;
                if (req.query.eventId != undefined && typeof req.query.eventId === "string")
                    eventId = req.query.eventId;
                ticket_1.ticketModel.aggregate((0, ticket_1.lookupQuery)({
                    $match: {
                        $and: [
                            ...[{ purchaseInfo: { $ne: null } }],
                            ...eventId ? [{ eventId: new mongodb_1.ObjectId(eventId) }] : []
                        ]
                    }
                }, { populateType: populateType })).
                    then(async (doc) => next({
                    success: true,
                    data: doc
                })).
                    catch(err => next(err));
            }
            else if (req.query.list != undefined && req.query.userId && typeof req.query.userId === "string") {
                let ids;
                try {
                    ids = (JSON.parse(req.query.list)).filter((value) => typeof value == "string");
                }
                catch (e) {
                    return next(new database_1.RequestError("Ids are not in regconized format"));
                }
                if (req.session["user"] != null && req.session["user"]._id && req.session["user"]._id != req.query.userId) {
                    next(new database_1.RequestError("This reveals information of another user"));
                    return;
                }
                else {
                    let userId = req.session["user"]._id;
                    ticket_1.ticketModel.aggregate((0, ticket_1.lookupQuery)({
                        $match: {
                            _id: { $in: ids.map(id => new mongodb_1.ObjectId(id)) }
                        }
                    }, { populateType: "none", checkIfBelongsToUser: userId })).
                        then(async (docs) => next({
                        sucess: true,
                        data: docs
                    }));
                }
            }
        });
        ticket.get("/:ticketId", async (req, res, next) => {
            let populateType = InferPopulateType(req);
            ticket_1.ticketModel.aggregate((0, ticket_1.lookupQuery)({
                $match: {
                    _id: new mongodb_1.ObjectId(req.params.ticketId)
                }
            }, { populateType: populateType, })).
                then(async (docs) => docs.length > 0 ?
                next({
                    success: true,
                    data: docs[0]
                }) :
                ticketNotFound(req.params.ticketId)).
                catch(err => next(err));
        });
        ticket.post("/", async (req, res, next) => {
            if (req.query.create != undefined) {
                if (req.query.batch != undefined && req.body.tickets && Array.isArray(req.body.tickets)) {
                    return ticket_1.ticketModel.startSession().
                        then(_session => {
                        res.locals.session = _session;
                        res.locals.session ? res.locals.session.startTransaction() : null;
                        return ticket_1.ticketModel.create(req.body.tickets);
                    }).
                        then(async (docs) => await Promise.all(docs.map(doc => doc.fullyPopulate()))).
                        then(json => next({ success: true, data: json })).
                        catch(err => next(err));
                }
                else if (req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string") {
                    var ticketDoc = new ticket_1.ticketModel(req.body);
                    ticketDoc.save().
                        then(_ => next({ success: true })).
                        catch(err => next(err));
                }
            }
        });
        ticket.patch("", async (req, res, next) => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                let ids = req.body.ticketIds;
                if (req.query.buy != undefined) {
                    if (req.session['user'] && req.session['user']._id) {
                        let userId = req.session['user']._id;
                        return ticket_1.ticketModel.startSession().
                            then(_session => {
                            res.locals.session = _session;
                            res.locals.session ? res.locals.session.startTransaction() : null;
                            return ticket_1.ticketModel.bulkPurchase(userId, ids, _session);
                        }).
                            then(docs => next({ success: true, data: docs })).
                            catch(err => next(err));
                    }
                    else {
                        next(new database_1.RequestError("Buying ticket requires a user login"));
                    }
                }
                else if (typeof req.query.tierName == "string") {
                    let tierName = req.query.tierName;
                    return ticket_1.ticketModel.startSession().
                        then(_session => {
                        res.locals.session = _session;
                        res.locals.session ? res.locals.session.startTransaction() : null;
                        return ticket_1.ticketModel.batchUpdatePriceTier(ids, tierName);
                    }).
                        then(async (docs) => await Promise.all(docs.map(doc => doc.fullyPopulate()))).
                        then(json => next({ success: true, data: json }));
                }
            }
        });
        ticket.patch("/:ticketId", async (req, res, next) => {
            if (req.query.verify != undefined &&
                (req.body.confirmedBy != undefined || req.body.confirmerId == null || typeof req.body.confirmerId == "string") &&
                (req.body.remark == undefined || req.body.remark == null || typeof req.body.remark == "string")) {
                ticket_1.ticketModel.findById(req.params.ticketId).
                    then(ticketDoc => {
                    if (ticketDoc) {
                        if (req.body.confirmedBy != "") {
                            let info = {
                                confirmerId: req.session['user']._id,
                                confirmedBy: req.body.confirmedBy,
                                remark: req.body.remark,
                                confirmationDate: new Date()
                            };
                            ticketDoc.paymentInfo = info;
                        }
                        else {
                            ticketDoc.paymentInfo = undefined;
                        }
                        return ticketDoc.save();
                    }
                    else {
                        ticketNotFound(req.params.ticketId);
                    }
                }).
                    then(async (doc) => next({ success: true, data: await doc?.fullyPopulate() })).
                    catch(err => next(err));
            }
            else if (req.query.void != undefined) {
                let username = req.session?.user?.username;
                ticket_1.ticketModel.findById(req.params.ticketId).
                    then(doc => doc?.voidPurchased(username)).
                    then(doc => next({ success: true })).
                    catch(err => next(err));
            }
        });
        ticket.delete("/", async (req, res, next) => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                let ids = req.body.ticketIds;
                ticket_1.ticketModel.startSession().
                    then(_session => {
                    res.locals.session = _session;
                    res.locals.session ? res.locals.session.startTransaction() : null;
                    return ticket_1.ticketModel.deleteMany({ _id: { $in: ids.map(id => new mongodb_1.ObjectId(id)) } }, ids).exec();
                }).
                    then(docs => next({ success: true })).
                    catch(err => next(err));
            }
        });
        ticket.delete("/:ticketId", async (req, res, next) => {
            ticket_1.ticketModel.findById(req.params.ticketId).
                then(ticketDoc => {
                if (ticketDoc) {
                    return ticketDoc.deleteOne({ includeResultMetadata: true }).exec();
                }
                else {
                    ticketNotFound(req.params.ticketId);
                }
            }).
                then((deleteResult) => {
                if (deleteResult && deleteResult.deletedCount > 0) {
                    next({ success: true });
                }
                else {
                    next({ success: false });
                }
            }).catch((err) => next(err));
        });
        return ticket;
    }
    Ticket.RouterFactory = RouterFactory;
    ;
})(Ticket = exports.Ticket || (exports.Ticket = {}));
