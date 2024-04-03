"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDAO = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
class BaseDAO {
    get id() {
        return this._id ? new mongodb_1.ObjectId(this._id.toString()) : null;
    }
    constructor(id) {
        this._id = id;
    }
    PropertiesWithGetter() {
        return Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(Reflect.getPrototypeOf(this)))
            .filter(e => typeof e[1].get === 'function' && e[0] !== '__proto__')
            .map(e => {
            var self = this;
            return [e[0], self[e[0]]];
        }));
    }
    Serialize(pushErrorWhenUndefined) {
        var obj = this.PropertiesWithGetter();
        if (pushErrorWhenUndefined) {
            var undefinedEntries = Object.entries(obj).filter(e => e[1] === undefined);
            if (undefinedEntries.length > 0)
                BaseDAO.RequestErrorList.push(new database_1.RequestError(`Undefined entries: ${undefinedEntries.map(e => e[0]).join(", ")}`));
        }
        return obj;
    }
    Hydrated() {
        var obj = this.PropertiesWithGetter();
        obj = Object.assign({ _id: this._id }, obj);
        return obj;
    }
}
exports.BaseDAO = BaseDAO;
BaseDAO.RequestErrorList = new Array();
