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
exports.RequestError = exports.Database = void 0;
const mongodb_1 = require("mongodb");
class Database {
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mongo.connect();
            // Send a ping to confirm a successful connection
            yield this.mongo.db("admin").command({ ping: 1 });
            this.mongodb = this.mongo.db(this.db_name);
        });
    }
}
exports.Database = Database;
Database.db_name = "ticketing";
Database.uri = process.env.mongo_url ? process.env.mongo_url :
    `mongodb+srv://${process.env.mongo_username}:${process.env.mongo_password}@atlascluster.gbqtcg3.mongodb.net/?retryWrites=true&w=majority`;
Database.mongo = new mongodb_1.MongoClient(Database.uri);
class RequestError extends Error {
    constructor(m) {
        super(m);
        Object.setPrototypeOf(this, RequestError.prototype);
    }
}
exports.RequestError = RequestError;
