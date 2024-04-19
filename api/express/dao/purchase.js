//indevelopment, not in use
import { ObjectId } from "mongodb";
import { BaseDAO } from "./dao";
export class PurchaseDAO extends BaseDAO {
    static collection_name = "purchases";
    _ticketIds = new Array();
    get ticketIds() { return this._ticketIds; }
    set ticketIds(value) {
        if (Array.isArray(value)) {
            function isObjectIdArray(arr) {
                return arr.every(it => it instanceof ObjectId);
            }
            if (isObjectIdArray(value)) {
                this._ticketIds = value;
            }
            else {
                this._ticketIds = value.filter(it => typeof it === "string").map(it => new ObjectId(it));
            }
        }
        else if (typeof value === "string") {
            this._ticketIds?.push(new ObjectId(value));
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
            this._ticketIds?.push(new ObjectId(value));
        }
    }
    _perchaserId = null;
    get perchaserId() { return this._perchaserId; }
}
