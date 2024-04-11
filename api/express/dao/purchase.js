"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseDAO = void 0;
//indevelopment, not in use
const mongodb_1 = require("mongodb");
const dao_1 = require("./dao");
class PurchaseDAO extends dao_1.BaseDAO {
    constructor() {
        super(...arguments);
        this._ticketIds = new Array();
        this._perchaserId = null;
    }
    get ticketIds() { return this._ticketIds; }
    set ticketIds(value) {
        var _a;
        if (Array.isArray(value)) {
            function isObjectIdArray(arr) {
                return arr.every(it => it instanceof mongodb_1.ObjectId);
            }
            if (isObjectIdArray(value)) {
                this._ticketIds = value;
            }
            else {
                this._ticketIds = value.filter(it => typeof it === "string").map(it => new mongodb_1.ObjectId(it));
            }
        }
        else if (typeof value === "string") {
            (_a = this._ticketIds) === null || _a === void 0 ? void 0 : _a.push(new mongodb_1.ObjectId(value));
        }
    }
    get purchaserId() { return this._purchaserId; }
    get logs() { return this._logs; }
    set logs(value) {
        var _a;
        if (Array.isArray(value)) {
            function isPurchaseChangeLogArray(arr) {
                return arr.every(it => typeof it.isEmailSent === "boolean" && typeof it.desc === "string");
            }
            if (isPurchaseChangeLogArray(value)) {
                this._logs = value;
            }
        }
        else if (typeof value === "string") {
            (_a = this._ticketIds) === null || _a === void 0 ? void 0 : _a.push(new mongodb_1.ObjectId(value));
        }
    }
    get perchaserId() { return this._perchaserId; }
}
exports.PurchaseDAO = PurchaseDAO;
PurchaseDAO.collection_name = "purchases";
