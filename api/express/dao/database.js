import { MongoClient, } from "mongodb";
export class Database {
    static db_name = "ticketing";
    static uri = process.env.mongo_url ? process.env.mongo_url :
        `mongodb+srv://${process.env.mongo_username}:${process.env.mongo_password}@atlascluster.gbqtcg3.mongodb.net/?retryWrites=true&w=majority`;
    static mongo = new MongoClient(Database.uri);
    static mongodb;
    static async init() {
        await this.mongo.connect();
        // Send a ping to confirm a successful connection
        await this.mongo.db("admin").command({ ping: 1 });
        this.mongodb = this.mongo.db(this.db_name);
    }
}
export class RequestError extends Error {
    constructor(m) {
        super(m);
        Object.setPrototypeOf(this, RequestError.prototype);
    }
}
