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
exports.Seat = void 0;
const express_1 = require("express");
const seat_1 = require("../dao/seat");
var Seat;
(function (Seat) {
    function RouterFactory() {
        var seat = (0, express_1.Router)();
        seat.use((req, res, next) => {
            var _a;
            if (req.method != 'GET' && ((_a = req.session["user"]) === null || _a === void 0 ? void 0 : _a._isAdmin) != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        seat.get("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                seat_1.SeatDAO.listByVenueId(res, req.query.venueId).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) });
                }).catch((error) => next(error));
            }
        }));
        seat.post("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
        }));
        seat.patch("/:seatId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.body.coord) {
                var dao = yield seat_1.SeatDAO.getById(res, req.params.seatId);
                dao.coord = req.body.coord;
                dao.update().then((seat) => {
                    next({ success: true, data: seat.Hydrated() });
                }).catch((error) => next(error));
            }
        }));
        seat.delete("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {
                seat_1.SeatDAO.getByIds(res, req.body.seatIds).then(daos => seat_1.SeatDAO.batchDelete(res, daos)).then((seats) => {
                    next({ success: true, data: seats.map(seat => seat.Hydrated()) });
                }).catch((error) => next(error));
            }
        }));
        seat.delete("/:seatId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            seat_1.SeatDAO.getById(res, req.params.seatId).then(dao => dao.delete().then((value) => {
                next({ success: true });
            })).catch((error) => { next(error); });
        }));
        return seat;
    }
    Seat.RouterFactory = RouterFactory;
})(Seat = exports.Seat || (exports.Seat = {}));
