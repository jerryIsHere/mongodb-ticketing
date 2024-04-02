import express, { Express, Request, Response, NextFunction, Send } from "express";
import session from 'express-session';
import { Database, RequestError } from "./dao/database";
var MongoDBStore = require('connect-mongodb-session')(session);


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

import { User } from './express/user';
app.use('/user', User.RouterFactory());

import { Event } from './express/event';
app.use('/event', Event.RouterFactory());

import { Seat } from './express/seat';
app.use('/seat', Seat.RouterFactory());

import { Venue } from './express/venue';
app.use('/venue', Venue.RouterFactory());

import { PriceTier } from './express/priceTier';
app.use('/priceTier', PriceTier.RouterFactory());

import { Ticket } from './express/ticket';
app.use('/ticket', Ticket.RouterFactory());

import { Admin } from './express/admin';
import { BaseDAO } from "./dao/dao";
app.use('/admin', Admin.RouterFactory());

app.use('/*', function (_, res: Response) {
  res.redirect("/web/")
});

app.use((output: any, req: Request, res: Response, next: NextFunction) => {
  if (output instanceof RequestError || BaseDAO.RequestErrorList.length != 0) {
    if (Database.session.inTransaction()) {
      Database.session.abortTransaction();
    }
    else {
    }
    if (output instanceof RequestError) {
      res.status(400).json({ success: false, reason: output.message })
    }
    else {
      res.status(400).json({ success: false, reasons: BaseDAO.RequestErrorList.map(err => err.message) })
    }
  }
  else {
    if (Database.session.inTransaction()) {
      Database.session.commitTransaction();
      res.json(output)
    }
    else {
      res.json(output)
    }
  }
  Database.session.endSession();
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
