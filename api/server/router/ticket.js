"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = void 0;
const express_1 = require("express");
const database_1 = require("../database/database");
const mongodb_1 = require("mongodb");
const ticket_1 = require("../../mongoose-schema/v1/ticket");
var Ticket;
(function (Ticket) {
    function RouterFactory() {
        var ticket = (0, express_1.Router)();
        var shouldShowOccupant = (session) => {
            if (session && session.user)
                return session.user.hasAdminRight || session.user.isCustomerSupport;
            return false;
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
            let x = (await ticket_1.ticketModel.find({}).then());
            x?.map(y => y.disclose());
            if (req.query.eventId && typeof req.query.eventId == "string") {
                ticket_1.ticketModel.find().findByEventId(req.query.eventId).
                    then(doc => next({
                    success: true, data: doc?.map(doc => doc.disclose())
                })).
                    catch((err) => next(err));
            }
            else if (req.query.my != undefined && req.session['user'] && req.session['user']._id) {
                let userId = req.session['user']._id;
                ticket_1.ticketModel.find().findByPurchaser(userId).
                    then(doc => next({
                    success: true,
                    data: doc?.map(doc => doc.discloseToClient(userId))
                })).
                    catch((err) => next(err));
            }
            else if (req.query.sold != undefined) {
                let showOccupant = shouldShowOccupant(req.session);
                ticket_1.ticketModel.find().findSold().
                    then(doc => next({
                    success: true,
                    data: doc?.map(doc => showOccupant ? doc.fullyPopulate() : doc.disclose())
                })).
                    catch((err) => next(err));
            }
            else if (req.query.list != undefined && req.query.userId && typeof req.query.userId === "string") {
                let ids;
                try {
                    ids = (JSON.parse(req.query.list)).filter((value) => typeof value == "string");
                }
                catch (e) {
                }
                if (req.session["user"] != null && req.session["user"]._id && req.session["user"]._id != req.query.userId) {
                    next(new database_1.RequestError("This reveals information of another user"));
                    return;
                }
                else {
                    let userId = req.session["user"]._id;
                    if (ids) {
                        ticket_1.ticketModel.find({ _id: { $in: ids.map(id => new mongodb_1.ObjectId(id)) } }).
                            then(docs => next({
                            sucess: true,
                            data: docs.map(doc => doc.discloseToClient(userId))
                        }));
                    }
                    else {
                        next(new database_1.RequestError("unregconized list query"));
                    }
                }
            }
        });
        ticket.get("/:ticketId", async (req, res, next) => {
            let showOccupant = shouldShowOccupant(req.session);
            ticket_1.ticketModel.findById(req.params.eventId).
                then(doc => next({
                success: true,
                data: showOccupant ? doc?.fullyPopulate() : doc?.disclose()
            })).
                catch((err) => next(err));
        });
        ticket.post("/", async (req, res, next) => {
            if (req.query.create != undefined) {
                if (req.query.batch != undefined && req.body.tickets && Array.isArray(req.body.tickets)) {
                    return ticket_1.ticketModel.startSession().
                        then(_session => {
                        res.locals.session = _session;
                        res.locals.session.startTransaction();
                        return ticket_1.ticketModel.create(req.body.tickets);
                    }).
                        then(docs => docs.map(doc => doc.fullyPopulate())).
                        then(json => { return { success: true, data: json }; });
                }
                else if (req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string") {
                    var ticketDoc = new ticket_1.ticketModel(req.body);
                    await ticketDoc.save().catch((err) => next(err));
                    next({ success: true });
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
                            res.locals.session.startTransaction();
                            return ticket_1.ticketModel.bulkPurchase(userId, ids);
                        }).
                            then(docs => next({ success: true })).
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
                        res.locals.session.startTransaction();
                        return ticket_1.ticketModel.batchUpdatePriceTier(ids, tierName);
                    }).
                        then(docs => docs.map(doc => doc.fullyPopulate())).
                        then(json => { return { success: true, data: json }; });
                }
            }
        });
        ticket.patch("/:ticketId", async (req, res, next) => {
            if (req.query.verify != undefined &&
                (req.body.confirmedBy != undefined || req.body.confirmedBy == null || typeof req.body.confirmedBy == "string") &&
                (req.body.remark == undefined || req.body.remark == null || typeof req.body.remark == "string")) {
                let info = {
                    confirmedBy: req.body.securedBy,
                    remark: req.body.remark,
                    confirmationDate: new Date()
                };
                ticket_1.ticketModel.findByIdAndUpdate(req.params.ticketId, { paymentInfo: info }, { returnDocument: 'after' }).
                    then(doc => next({ success: true, data: doc?.fullyPopulate() })).
                    catch((err) => next(err));
            }
            else if (req.query.void != undefined) {
                let username = req.session?.user?.username;
                ticket_1.ticketModel.findById(req.params.ticketId).
                    then(doc => doc?.voidPurchased(username)).
                    then(doc => next({ success: true })).
                    catch((err) => next(err));
            }
        });
        ticket.delete("/", async (req, res, next) => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                let ids = req.body.ticketIds;
                ticket_1.ticketModel.startSession().
                    then(_session => {
                    res.locals.session = _session;
                    res.locals.session.startTransaction();
                    return ticket_1.ticketModel.deleteMany({ _id: { $in: ids.map(id => new mongodb_1.ObjectId(id)) } }, ids);
                }).
                    then(docs => next({ success: true })).
                    catch(err => next(err));
            }
        });
        ticket.delete("/:ticketId", async (req, res, next) => {
            let deleteResult = await ticket_1.ticketModel.findByIdAndDelete(req.params.ticketId, { includeResultMetadata: true }).exec().catch((err) => next(err));
            if (deleteResult && deleteResult.ok) {
                next({ success: true });
            }
            else {
                next({ success: false });
            }
        });
        return ticket;
    }
    Ticket.RouterFactory = RouterFactory;
    ;
})(Ticket = exports.Ticket || (exports.Ticket = {}));
