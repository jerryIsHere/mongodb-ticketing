"use strict";
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
            if (req.method != 'GET' && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        venue.get("/", async (req, res, next) => {
            if (req.query.list != undefined) {
                venue_1.VenueDAO.listAll(res).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) });
                }).catch((error) => next(error));
            }
        });
        venue.get("/:venueId", async (req, res, next) => {
            venue_1.VenueDAO.getById(res, req.params.venueId).then(result => {
                if (result)
                    next({ success: true, data: result.Hydrated() });
            }).catch((error) => next(error));
        });
        venue.post("/", async (req, res, next) => {
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
        });
        venue.patch("/:venueId", async (req, res, next) => {
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
        });
        venue.delete("/:venueId", async (req, res, next) => {
            venue_1.VenueDAO.getById(res, req.params.venueId).then(dao => dao.delete()).then((value) => {
                next({ success: true });
            }).catch((error) => next(error));
        });
        return venue;
    }
    Venue.RouterFactory = RouterFactory;
    ;
})(Venue = exports.Venue || (exports.Venue = {}));
