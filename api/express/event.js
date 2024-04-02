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
exports.Event = void 0;
const express_1 = require("express");
const event_1 = require("../dao/event");
var Event;
(function (Event) {
    function RouterFactory() {
        var event = (0, express_1.Router)();
        event.use((req, res, next) => {
            var _a;
            if (req.method != 'GET' && ((_a = req.session["user"]) === null || _a === void 0 ? void 0 : _a._isAdmin) != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        event.get("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.list != undefined) {
                event_1.EventDAO.listAll().then((result) => {
                    next({ success: true, data: result });
                }).catch((error) => next(error));
            }
        }));
        event.get("/:eventId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            event_1.EventDAO.getById(req.params.eventId).then(result => {
                if (result)
                    next({ success: true, data: result.Hydrated() });
            }).catch((error) => next(error));
        }));
        event.post("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId;
                    var dao = new event_1.EventDAO({
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                    });
                    dao.venueId = req.body.venueId;
                    dao.create().then((value) => {
                        next({ success: true });
                    }).catch((error) => next(error));
                }
            }
        }));
        event.patch("/:eventId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                event_1.EventDAO.getById(req.params.eventId).then((dao) => {
                    dao.eventname = req.body.eventname;
                    dao.datetime = req.body.datetime;
                    dao.duration = req.body.duration;
                    dao.venueId = req.body.venueId;
                    return dao.update();
                }).then((value) => {
                    next({ success: true, data: value.Hydrated() });
                }).catch((error) => next(error));
            }
        }));
        event.delete("/:eventId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            event_1.EventDAO.getById(req.params.eventId).then(dao => dao.delete().then((value) => {
                next({ success: true });
            })).catch((error) => next(error));
        }));
        return event;
    }
    Event.RouterFactory = RouterFactory;
})(Event = exports.Event || (exports.Event = {}));
