"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seat = void 0;
const express_1 = require("express");
const seat_1 = require("../../mongoose-schema/v1/seat");
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
                next({ success: true, data: await seat_1.seatModel.find().findByVenueId(req.query.venueId).lean().exec() });
            }
        });
        seat.post("/", async (req, res, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId;
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    return seat_1.seatModel.startSession().
                        then(_session => {
                        res.locals.session = _session;
                        res.locals.session.startTransaction();
                        return seat_1.seatModel.create(req.body.seats);
                    }).
                        then(docs => docs.map(doc => doc.toJSON())).
                        then(json => { return { success: true, data: json }; });
                }
            }
        });
        seat.patch("/:seatId", async (req, res, next) => {
            if (req.body.coord) {
                let seatDoc = await seat_1.seatModel.findByIdAndUpdate(req.params.seatId, { coord: req.body.coord }, { returnDocument: "after", lean: true }).exec().catch((err) => next(err));
                next({ success: true, data: seatDoc });
            }
        });
        seat.delete("/", async (req, res, next) => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {
                return seat_1.seatModel.startSession().
                    then(_session => {
                    res.locals.session = _session;
                    res.locals.session.startTransaction();
                    return Promise.all(req.body.seatIds.map(async (seatId) => {
                        return seat_1.seatModel.findByIdAndDelete(seatId).exec();
                    }));
                }).
                    then(docs => docs.map(doc => doc.toJSON())).
                    then(json => { return { success: true, data: json }; });
            }
        });
        seat.delete("/:seatId", async (req, res, next) => {
            let deleteResult = await seat_1.seatModel.findByIdAndDelete(req.params.seatId, { includeResultMetadata: true }).exec().catch((err) => next(err));
            if (deleteResult && deleteResult.ok) {
                next({ success: true });
            }
            else {
                next({ success: false });
            }
        });
        return seat;
    }
    Seat.RouterFactory = RouterFactory;
})(Seat = exports.Seat || (exports.Seat = {}));
