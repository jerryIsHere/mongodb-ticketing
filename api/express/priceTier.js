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
exports.PriceTier = void 0;
const express_1 = require("express");
const priceTier_1 = require("../dao/priceTier");
var PriceTier;
(function (PriceTier) {
    function RouterFactory() {
        var priceTier = (0, express_1.Router)();
        priceTier.use((req, res, next) => {
            var _a;
            if (req.method != 'GET' && ((_a = req.session["user"]) === null || _a === void 0 ? void 0 : _a._isAdmin) != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        priceTier.get("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.list != undefined) {
                priceTier_1.PriceTierDAO.listAll().then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) });
                }).catch((error) => next(error));
            }
        }));
        priceTier.get("/:priceTierId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        }));
        priceTier.post("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.create != undefined) {
                if (req.body.tierName && req.body.price) {
                    var dao = new priceTier_1.PriceTierDAO({
                        tierName: req.body.tierName,
                        price: req.body.price,
                    });
                    dao.create().then((value) => {
                        next({ success: true });
                    }).catch((error) => next(error));
                }
            }
        }));
        priceTier.patch("/:priceTierId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.body.tierName && req.body.price) {
                priceTier_1.PriceTierDAO.getById(req.params.priceTierId).then(dao => {
                    dao.tierName = req.body.tierName;
                    dao.price = req.body.price;
                    return dao.update();
                }).then((value) => {
                    next({ success: true });
                }).catch((error) => next(error));
            }
        }));
        priceTier.delete("/:priceTierId", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            priceTier_1.PriceTierDAO.getById(req.params.priceTierId).then(dao => dao.delete().then((value) => {
                next({ success: true });
            })).catch((error) => next(error));
        }));
        return priceTier;
    }
    PriceTier.RouterFactory = RouterFactory;
})(PriceTier = exports.PriceTier || (exports.PriceTier = {}));
