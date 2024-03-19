import express, { Express, Request, Response, NextFunction, Send } from "express";
import session from 'express-session';
import { Database, RequestError } from "./dao/database";
var MongoDBStore = require('connect-mongodb-session')(session);

declare namespace process {
  namespace env {
    let mongo_username: string
    let mongo_password: string
    let PORT: string | null
  }
}

const port = process.env.PORT || 3000;
const app: Express = express();

// sql session
const options = {
  uri: Database.uri,
  databaseName: 'sessions',
  collection: 'sessions'
}
var sessionStore = new MongoDBStore(options);
sessionStore.on('error', (error: any) => {
  console.error(error);
});
app.use(session({
  secret: 'sakdjfpaoisdfjpaosdijf',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));


// angular front
app.use('/web', express.static('web/dist/ticketing/browser'))
app.use('/web/*', function (_, res: Response) {
  const options = {
    root: 'web/dist/ticketing/browser'
  };
  const fileName = 'index.html';
  res.sendFile(fileName, options);
});
app.use(express.json())

import { User } from './dao/user';
app.use('/user', User.RouterFactory());

import { Event } from './dao/event';
app.use('/event', Event.RouterFactory());

import { Seat } from './dao/seat';
app.use('/seat', Seat.RouterFactory());

import { Venue } from './dao/venue';
app.use('/venue', Venue.RouterFactory());

import { PriceTier } from './dao/priceTier';
app.use('/priceTier', PriceTier.RouterFactory());

import { Admin } from './dao/admin';
import { Config } from "./dao/config";
app.use('/admin', Admin.RouterFactory());


app.listen(port, async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await Database.mongo.connect();
    // Send a ping to confirm a successful connection
    await Database.mongo.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    Database.mongodb = Database.mongo.db(Config.db_name)
  } catch (_) {

  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof RequestError) {
    res.status(400).json({ success: false, reason: err.message })
  }
})