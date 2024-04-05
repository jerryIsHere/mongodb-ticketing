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
exports.Venue = void 0;
const express_1 = require("express");
const database_1 = require("../dao/database");
const venue_1 = require("../dao/venue");
var Venue;
(function (Venue) {
    function RouterFactory() {
        var venue = (0, express_1.Router)();
        venue.use((req, res, next) => {
            var _a;
            if (req.method != 'GET' && ((_a = req.session["user"]) === null || _a === void 0 ? void 0 : _a._isAdmin) != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        venue.get("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.list != undefined) {
                venue_1.VenueDAO.listAll(res).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) });
                }).catch((error) => next(error));
            }
        }));
        venue.get("/:venueId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            venue_1.VenueDAO.getById(res, req.params.venueId).then(result => {
                if (result)
                    next({ success: true, data: result.Hydrated() });
            }).catch((error) => next(error));
        }));
        venue.post("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.create != undefined && req.body.venuename && req.body.sections) {
                if (req.body.sections.filter((s) => !(0, venue_1.sectionTypeCheck)(s)).length > 0)
                    return next(new database_1.RequestError("Requested sections is not in correct format"));
                var dao = new venue_1.VenueDAO(res, {
                    venuename: req.body.venuename,
                    sections: req.body.sections
                });
                dao.create().then((value) => {
                    next({ success: true });
                }).catch((error) => next(error));
            }
        }));
        venue.patch("/:venueId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.body.venuename) {
                if (req.body.sections.filter((s) => !(0, venue_1.sectionTypeCheck)(s)).length > 0)
                    return next(new database_1.RequestError("Requested sections is not in correct format"));
                venue_1.VenueDAO.getById(res, req.params.venueId).then(dao => {
                    dao.venuename = req.body.venuename;
                    dao.sections = req.body.sections;
                    return dao.update();
                }).then((value) => {
                    next({ success: true });
                }).catch((error) => next(error));
            }
        }));
        venue.delete("/:venueId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            venue_1.VenueDAO.getById(res, req.params.venueId).then(dao => dao.delete()).then((value) => {
                next({ success: true });
            }).catch((error) => next(error));
        }));
        return venue;
    }
    Venue.RouterFactory = RouterFactory;
    ;
})(Venue = exports.Venue || (exports.Venue = {}));
