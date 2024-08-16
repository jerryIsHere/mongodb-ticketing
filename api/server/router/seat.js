"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seat = void 0;
const express_1 = require("express");
const seat_1 = require("../../mongoose-schema/v1/seat");
const database_1 = require("../database/database");
let seatNotFound = (id) => { throw new database_1.RequestError(`Seat with id ${id} not found.`); };
var Seat;
(function (Seat) {
    function RouterFactory() {
        var seat = (0, express_1.Router)();
        seat.use((req, res, next) => {
            if (req.method != 'GET' && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        seat.get("/", async (req, res, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                seat_1.seatModel.find().findByVenueId(req.query.venueId).lean().
                    then(doc => next({ success: true, data: doc })).
                    catch(err => next(err));
            }
        });
        seat.post("/", async (req, res, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId;
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    return seat_1.seatModel.startSession().
                        then(_session => {
                        res.locals.session = _session;
                        res.locals.session ? res.locals.session.startTransaction() : null;
                        return seat_1.seatModel.create(req.body.seats.map((s) => {
                            return {
                                ...s,
                                ...{
                                    venueId: req.query.venueId
                                }
                            };
                        }));
                    }).
                        then(docs => docs.map(doc => doc.toJSON())).
                        then(json => next({ success: true, data: json })).
                        catch(err => next(err));
                }
            }
        });
        seat.patch("/:seatId", async (req, res, next) => {
            if (req.body.coord) {
                seat_1.seatModel.findById(req.params.seatId).
                    then(seatDoc => {
                    if (seatDoc) {
                        Object.keys(req.body).forEach(key => {
                            if (key in seatDoc) {
                                seatDoc[key] = req.body[key];
                            }
                        });
                        return seatDoc.save();
                    }
                    else {
                        seatNotFound(req.params.seatId);
                    }
                }).
                    then(seat => next({ success: true, data: seat })).
                    catch(err => next(err));
            }
        });
        seat.delete("/", async (req, res, next) => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {
                return seat_1.seatModel.startSession().
                    then(_session => {
                    res.locals.session = _session;
                    res.locals.session ? res.locals.session.startTransaction() : null;
                    return Promise.all(req.body.seatIds.map(async (seatId) => {
                        return seat_1.seatModel.findById(seatId).
                            then(seatDoc => {
                            if (seatDoc) {
                                return seatDoc.deleteOne({ includeResultMetadata: true }).exec();
                            }
                            else {
                                seatNotFound(req.params.seatId);
                            }
                        });
                    }));
                }).
                    then(json => { next({ success: true, data: json }); }).
                    catch((err) => next(err));
            }
        });
        seat.delete("/:seatId", async (req, res, next) => {
            seat_1.seatModel.findById(req.params.seatId).
                then(seatDoc => {
                if (seatDoc) {
                    return seatDoc.deleteOne({ includeResultMetadata: true }).exec();
                }
                else {
                    seatNotFound(req.params.seatId);
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
        return seat;
    }
    Seat.RouterFactory = RouterFactory;
})(Seat = exports.Seat || (exports.Seat = {}));
