import express, { Express, Request, Response, NextFunction, Send } from "express";
import session from 'express-session';
import { Database, RequestError } from "./express/dao/database";
var MongoDBStore = require('connect-mongodb-session')(session);


const port = process.env.PORT || 3000;
const app: Express = express();
import { ClientSession } from "mongodb";
import { UserDAO } from './express/dao/user';
declare global {
  namespace Express {
    interface Locals {
      RequestErrorList: RequestError[]
      session: ClientSession
    }
  }
}
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
app.set("trust proxy", true);
app.use(session({
  name:'ticketing_sessionid',
  secret: 'sakdjfpaoisdfjpaosdijf',
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: false, secure: false, sameSite: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
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

app.use('*', function (req, res: Response, next) {
  res.locals.RequestErrorList = new Array<RequestError>();

  res.locals.session = Database.mongo.startSession();
  next()
});
app.use(express.json())

import { User } from './express/router/user';
app.use('/user', User.RouterFactory());

import { Event } from './express/router/event';
app.use('/event', Event.RouterFactory());

import { Seat } from './express/router/seat';
app.use('/seat', Seat.RouterFactory());

import { Venue } from './express/router/venue';
app.use('/venue', Venue.RouterFactory());

import { PriceTier } from './express/router/priceTier';
app.use('/priceTier', PriceTier.RouterFactory());

import { Ticket } from './express/router/ticket';
app.use('/ticket', Ticket.RouterFactory());

import { Admin } from './express/router/admin';
import { BaseDAO } from "./express/dao/dao";
app.use('/admin', Admin.RouterFactory());

app.use('/*', function (_, res: Response) {
  res.redirect("/web/")
});

app.use(async (output: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (output instanceof RequestError || res.locals.RequestErrorList.length != 0) {
      if (res.locals.session.inTransaction()) {
        console.log("abort");
        await res.locals.session.abortTransaction();
      }
      else {
      }
      if (output instanceof RequestError) {
        res.locals.RequestErrorList.push(output)
      }
      res.status(400).json({ success: false, reasons: res.locals.RequestErrorList.map((err: any) => err.message) })
    }
    else {
      if (res.locals.session.inTransaction()) {
        await res.locals.session.commitTransaction();
        res.json(output)
      }
      else {
        res.json(output)
      }
    }
    res.locals.session.endSession();
  }
  catch (err) {
    console.log(err)
  }
  finally{
    res.end()
  }
})
Database.init().then(_ => {
  app.listen(port, async () => {
    try {
      // Connect the client to the server	(optional starting in v4.7)

      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (_) {

    }
  });
})
