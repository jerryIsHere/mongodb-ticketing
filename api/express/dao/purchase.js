"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseDAO = void 0;
//indevelopment, not in use
const mongodb_1 = require("mongodb");
const dao_1 = require("./dao");
class PurchaseDAO extends dao_1.BaseDAO {
    static collection_name = "purchases";
    _ticketIds = new Array();
    get ticketIds() { return this._ticketIds; }
    set ticketIds(value) {
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
            this._ticketIds?.push(new mongodb_1.ObjectId(value));
        }
    }
    _purchaserId;
    get purchaserId() { return this._purchaserId; }
    _logs;
    get logs() { return this._logs; }
    set logs(value) {
        if (Array.isArray(value)) {
            function isPurchaseChangeLogArray(arr) {
                return arr.every(it => typeof it.isEmailSent === "boolean" && typeof it.desc === "string");
            }
            if (isPurchaseChangeLogArray(value)) {
                this._logs = value;
            }
        }
        else if (typeof value === "string") {
            this._ticketIds?.push(new mongodb_1.ObjectId(value));
        }
    }
    _perchaserId = null;
    get perchaserId() { return this._perchaserId; }
}
exports.PurchaseDAO = PurchaseDAO;
