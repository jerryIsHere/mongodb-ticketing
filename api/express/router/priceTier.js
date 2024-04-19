"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceTier = void 0;
const express_1 = require("express");
const priceTier_1 = require("../dao/priceTier");
var PriceTier;
(function (PriceTier) {
    function RouterFactory() {
        var priceTier = (0, express_1.Router)();
        priceTier.use((req, res, next) => {
            if (req.method != 'GET' && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        priceTier.get("/", async (req, res, next) => {
            if (req.query.list != undefined) {
                priceTier_1.PriceTierDAO.listAll(res).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) });
                }).catch((error) => next(error));
            }
        });
        priceTier.get("/:priceTierId", async (req, res, next) => {
        });
        priceTier.post("/", async (req, res, next) => {
            if (req.query.create != undefined) {
                if (req.body.tierName && req.body.price) {
                    var dao = new priceTier_1.PriceTierDAO(res, {
                        tierName: req.body.tierName,
                        price: req.body.price,
                    });
                    dao.create().then((value) => {
                        next({ success: true });
                    }).catch((error) => next(error));
                }
            }
        });
        priceTier.patch("/:priceTierId", async (req, res, next) => {
            if (req.body.tierName && req.body.price) {
                priceTier_1.PriceTierDAO.getById(res, req.params.priceTierId).then(dao => {
                    dao.tierName = req.body.tierName;
                    dao.price = req.body.price;
                    return dao.update();
                }).then((value) => {
                    next({ success: true });
                }).catch((error) => next(error));
            }
        });
        priceTier.delete("/:priceTierId", async (req, res, next) => {
            priceTier_1.PriceTierDAO.getById(res, req.params.priceTierId).then(dao => dao.delete().then((value) => {
                next({ success: true });
            })).catch((error) => next(error));
        });
        return priceTier;
    }
    PriceTier.RouterFactory = RouterFactory;
})(PriceTier = exports.PriceTier || (exports.PriceTier = {}));
