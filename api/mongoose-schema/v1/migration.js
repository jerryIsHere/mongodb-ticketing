"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("../schema");
const priceTier_1 = require("../../server/database/dao/priceTier");
const database_1 = require("../../server/database/database");
const mongodb_1 = require("mongodb");
const ticket_1 = require("./ticket");
const user_1 = require("./user");
Promise.all([database_1.Database.init()])
    .catch(e => {
    console.error(e);
})
    .finally(async () => {
    console.log("start migration");
    let priceTiers = (await priceTier_1.PriceTierDAO.listAll({}));
    let priceTierWithId = priceTiers.map(p => p.Hydrated());
    console.log(priceTierWithId);
    let priceTierWithOutId = priceTiers.map(p => p.Serialize(false));
    await schema_1.v1.Event.eventModel.find({}).then(async (docs) => {
        for (let doc of docs) {
            doc.priceTiers = priceTierWithId;
            doc.saleInfos = [{
                    start: doc.get("startFirstRoundSellDate"),
                    end: doc.get("endFirstRoundSellDate"),
                    ticketQuota: doc.get("firstRoundTicketQuota"),
                    buyX: 0,
                    yFree: 0,
                }, {
                    start: doc.get("startSecondRoundSellDate"),
                    end: doc.get("endSecondRoundSellDate"),
                    ticketQuota: doc.get("secondRoundTicketQuota"),
                    buyX: 0,
                    yFree: 0,
                }];
            await doc.save({ validateBeforeSave: false });
        }
    });
    await schema_1.v1.Ticket.ticketModel.find({}).then(async (docs) => {
        for (let doc of docs) {
            if (doc.get("remark")) {
                doc.paymentInfo = new ticket_1.paymentInfoModel({
                    confirmationDate: doc.get("confirmationDate") ? doc.get("confirmationDate") : new Date(),
                    confirmedBy: doc.get("confirmedBy"),
                    confirmerId: doc.get("confirmerId") ? doc.get("confirmerId") : new mongodb_1.ObjectId("6629e5b2108208b0675ce1bd"),
                    remark: doc.get("remark")
                });
            }
            if (doc.get("occupantId")) {
                doc.purchaseInfo = new ticket_1.purchaseInfoModel({
                    purchaseDate: doc.get("purchaseDate"),
                    purchaserId: doc.get("occupantId"),
                });
            }
            doc.priceTier = priceTierWithId.find(pt => pt._id.equals(doc.get("priceTierId")));
            await doc.save({ validateBeforeSave: false });
        }
    });
    await user_1.userModel.updateMany({ isAdmin: true }, {
        $set: {
            _isAdmin: true
        }
    }).exec();
    await user_1.userModel.updateMany({ isCustomerSupport: true }, {
        $set: {
            _isCustomerSupport: true
        }
    }).exec();
    console.log("migrate event");
    schema_1.v1.Event.eventModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())));
    console.log("migrate notification");
    schema_1.v1.Notification.notificationModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())));
    console.log("migrate seat");
    schema_1.v1.Seat.seatModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())));
    console.log("migrate venue");
    schema_1.v1.Venue.venueModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())));
    console.log("migrate user");
    schema_1.v1.User.userModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())));
});
