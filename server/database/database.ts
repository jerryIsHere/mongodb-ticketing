import { ClientSession, Db, MongoClient, } from "mongodb";
import { connect } from 'mongoose';

declare namespace process {
    namespace env {
        let mongo_username: string
        let mongo_password: string
        let mongo_url: string | undefined
        let PORT: string | null
    }
}
export abstract class Database {
    public static readonly db_name = "ticketing"

    public static readonly uri: string = process.env.mongo_url ? process.env.mongo_url :
        `mongodb+srv://${process.env.mongo_username}:${process.env.mongo_password}@atlascluster.gbqtcg3.mongodb.net/?retryWrites=true&w=majority`

    public static mongo: MongoClient = new MongoClient(Database.uri)

    public static mongodb: Db;

    public static async init(uri = undefined) {
        console.log("Database init: ", Database.uri)
        await this.mongo.connect();
        // Send a ping to confirm a successful connection
        await this.mongo.db("admin").command({ ping: 1 });

        await connect(Database.uri, {dbName: this.db_name})
        this.mongodb = this.mongo.db(this.db_name)
        console.log("Database init completed")
    }

}


export class RequestError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, RequestError.prototype);
    }

}
