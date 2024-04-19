"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seat = void 0;
const express_1 = require("express");
const seat_1 = require("../dao/seat");
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
                seat_1.SeatDAO.listByVenueId(res, req.query.venueId).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) });
                }).catch((error) => next(error));
            }
        });
        seat.post("/", async (req, res, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId;
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    var SeatTypeCheck = (s) => {
                        return typeof s.no == "number" &&
                            typeof s.row == "string" &&
                            s.coord &&
                            (0, seat_1.coordTypeCheck)(s.coord);
                    };
                    var daos = req.body.seats.filter((s) => SeatTypeCheck(s)).map((s) => {
                        var dao = new seat_1.SeatDAO(res, {
                            row: s.row,
                            no: Number(s.no),
                            coord: s.coord
                        });
                        dao.venueId = venueId;
                        return dao;
                    });
                    seat_1.SeatDAO.batchCreate(res, daos).then((seats) => {
                        next({ success: true, data: seats.map(seat => seat.Hydrated()) });
                    }).catch((error) => next(error));
                }
            }
        });
        seat.patch("/:seatId", async (req, res, next) => {
            if (req.body.coord) {
                var dao = await seat_1.SeatDAO.getById(res, req.params.seatId);
                dao.coord = req.body.coord;
                dao.update().then((seat) => {
                    next({ success: true, data: seat.Hydrated() });
                }).catch((error) => next(error));
            }
        });
        seat.delete("/", async (req, res, next) => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {
                seat_1.SeatDAO.getByIds(res, req.body.seatIds).then(daos => seat_1.SeatDAO.batchDelete(res, daos)).then((seats) => {
                    next({ success: true, data: seats.map(seat => seat.Hydrated()) });
                }).catch((error) => next(error));
            }
        });
        seat.delete("/:seatId", async (req, res, next) => {
            seat_1.SeatDAO.getById(res, req.params.seatId).then(dao => dao.delete().then((value) => {
                next({ success: true });
            })).catch((error) => { next(error); });
        });
        return seat;
    }
    Seat.RouterFactory = RouterFactory;
})(Seat = exports.Seat || (exports.Seat = {}));
