"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentInfoModel = exports.purchaseInfoModel = exports.ticketModel = exports.tickerSchema = exports.paymentInfoSchema = exports.purchaseInfoSchema = void 0;
const event_1 = require("./event");
const priceTier_1 = require("./priceTier");
const mongoose_1 = require("mongoose");
const seat_1 = require("./seat");
const user_1 = require("./user");
const notification_1 = require("./notification");
const schema_names_1 = require("../schema-names");
const error_1 = require("../error");
exports.purchaseInfoSchema = new mongoose_1.Schema({
    purchaseDate: { type: Date, requried: true },
    purchaserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: schema_names_1.names.User.singular_name,
        requried: true,
        validate: {
            validator: async (val) => {
                return (await user_1.userModel.findById(val).select({ _id: 1 }).lean()) != null;
            },
            message: `${schema_names_1.names.User.singular_name} with id {VALUE} doesn't exists.`,
        },
    },
}, {
    autoCreate: false,
    autoIndex: false,
});
exports.paymentInfoSchema = new mongoose_1.Schema({
    confirmerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: schema_names_1.names.User.singular_name,
        required: true,
        validate: {
            validator: async (val) => {
                let confimer = await user_1.userModel.findById(val);
                if (confimer == null)
                    throw new error_1.ReferentialError(`${schema_names_1.names.User.singular_name} with id {VALUE} doesn't exists.`);
                if (!confimer._isAdmin && !confimer._isCustomerSupport)
                    throw new error_1.ReferentialError(`${schema_names_1.names.User.singular_name} with id {VALUE} do not have such permission.`);
                return true;
            },
        },
    },
    remark: { type: String },
    confirmationDate: { type: Date, required: true },
}, {
    autoCreate: false,
    autoIndex: false,
});
exports.tickerSchema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: schema_names_1.names.Event.singular_name,
        required: true,
        validate: {
            validator: async function (val) {
                let event = await event_1.eventModel.findById(val);
                if (event == null)
                    throw new error_1.ReferentialError(`Event with id ${val} doesn't exists.`);
                let priceTier = event.priceTiers.find((p) => p.tierName == this.priceTier.tierName);
                if (priceTier == undefined || priceTier.price != this.priceTier.price)
                    throw new error_1.ReferentialError(`Price tier ${this.priceTier.tierName} doesn't exists in associated event.`);
                return true;
            },
        },
    },
    seatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: schema_names_1.names.Seat.singular_name,
        required: true,
        validate: {
            validator: async function (val) {
                let seat = await seat_1.seatModel.findById(val).select({ _id: 1 }).lean();
                if (seat == null)
                    throw new error_1.ReferentialError(`Seat with id ${val} doesn't exists.`);
                return true;
            },
        },
    },
    priceTier: { type: priceTier_1.priceTierSchema, required: true },
    purchaseInfo: { type: exports.purchaseInfoSchema },
    paymentInfo: { type: exports.paymentInfoSchema },
}, {
    statics: {
        async bulkPurchase(userId, ticketIds) {
            let ticketObjectIds = ticketIds.map((id) => new mongoose_1.Types.ObjectId(id));
            let tickets = await exports.ticketModel.find({ _id: { $in: ticketObjectIds }, purchaseInfo: { $exists: false } }).exec();
            if (tickets.length != ticketIds.length) {
                let idsPurchaseable = tickets.map(model => model._id.toString());
                let idsNotPurchaseable = ticketIds.filter(id => !idsPurchaseable.includes(id));
                throw new error_1.OperationError(`Ticket${idsNotPurchaseable.length > 1 ? 's' : ''} with id ` +
                    idsNotPurchaseable.join(', ') +
                    `ha${idsNotPurchaseable.length > 1 ? 's' : 've'} been sold.`);
            }
            let events = await event_1.eventModel
                .find({ _id: { $in: tickets.map((t) => t.eventId) } })
                .lean()
                .exec();
            if (events.length != 1)
                throw new error_1.OperationError("Bulk purchase only supports buying tickets from exactly one event.");
            let event = events[0];
            if (ticketIds.length > event.shoppingCartSize)
                throw new error_1.ReferentialError(`Event with id ${event._id} have a shopping cart size limit at` +
                    ` ${event.shoppingCartSize} but you are requesting ${ticketIds.length} tickets.`);
            let now = new Date();
            let saleInfo = event.saleInfos.find((info) => {
                info.start <= now && info.end >= new Date();
            });
            if (saleInfo == null)
                throw new error_1.OperationError(`Tickets of event with id ${event._id} is not selling yet.`);
            let userTicketForEventCount = await exports.ticketModel.countDocuments({
                "paymentInfo.purchaserId": userId,
            });
            if (userTicketForEventCount + ticketIds.length >= saleInfo.ticketQuota)
                throw new error_1.OperationError(`You have no more ticket quota (${saleInfo.ticketQuota})` +
                    ` for event with id ${event._id}.`);
            let purchaseInfo = new exports.purchaseInfoModel({
                purchaserId: userId,
                purchaseDate: now,
            });
            purchaseInfo.validate();
            let purchasedTicket = await Promise.all(tickets.map(ticket => {
                ticket.purchaseInfo = purchaseInfo;
                // validation done with purchaseInfo.validate() and only one filed of ticket is modified.
                // purchaseinfo.validate requires finding user in db, and is slightly expensive
                return ticket.save({ validateBeforeSave: false });
            }));
            return purchasedTicket;
        },
        async batchUpdatePriceTier(ticketIds, tierName) {
            let ticketObjectIds = ticketIds.map((id) => new mongoose_1.Types.ObjectId(id));
            let tickets = await exports.ticketModel
                .find({ _id: { $in: ticketObjectIds } })
                .lean()
                .exec();
            let events = await event_1.eventModel
                .find({ _id: { $in: tickets.map((t) => t.eventId) } })
                .lean()
                .exec();
            if (events.length != 1)
                throw new error_1.OperationError("Batch price tier update only supports updating tickets from exactly one event.");
            let event = events[0];
            let match = event.priceTiers.find((p) => {
                p.tierName == tierName;
            });
            if (match == null)
                throw new error_1.ReferentialError(`Event with id ${event._id} does not have a price tier called ${tierName}.`);
            return exports.ticketModel
                .updateMany({ _id: { $in: ticketObjectIds } }, {
                $set: {
                    priceTier: match,
                },
            })
                .then();
        },
    },
    methods: {
        async voidPurchased(operatorName) {
            let purchaseInfo = this.purchaseInfo;
            if (purchaseInfo) {
                this.purchaseInfo = undefined;
                let purchaser = await user_1.userModel
                    .findById(purchaseInfo.purchaserId)
                    .then();
                let event = await event_1.eventModel.findById(this.eventId).then();
                let seat = await seat_1.seatModel.findById(this.seatId).then();
                await this.save();
                if (purchaser != null && event != null && seat != null) {
                    let salutation = purchaser.fullname
                        ? `Dear ${purchaser.fullname}\n`
                        : "";
                    let customerSupportInfo = operatorName ? ` by ${operatorName}` : "";
                    let purchaseDateInfo = purchaseInfo.purchaseDate
                        ? ` (at ${purchaseInfo.purchaseDate.toLocaleString()})`
                        : "";
                    let notification = new notification_1.notificationModel({
                        recipientId: purchaser._id,
                        email: purchaser.email,
                        title: "Ticket Voided",
                        message: salutation +
                            `1 ticket that you had purchased${purchaseDateInfo} is voided by${customerSupportInfo}.\n` +
                            `Information of that ticket:\n` +
                            `Event: ${event.eventname}\n` +
                            `Seat: ${seat.row + seat.no}\n`,
                    });
                    await notification.save();
                    await notification.send();
                }
                return this;
            }
            throw new error_1.OperationError(`Ticker with id ${this._id} has not been sold yet.`);
        },
        async discloseToClient(userId) {
            let disclosable = await this.disclose();
            return {
                event: disclosable.event,
                seat: disclosable.seat,
                priceTier: this.priceTier,
                purchased: this.purchaseInfo != undefined,
                belongsToUser: this.purchaseInfo != undefined &&
                    this.purchaseInfo.purchaserId == userId,
            };
        },
        async disclose() {
            let populated = await this.populate([
                { path: "eventId", model: schema_names_1.names.Event.singular_name },
                { path: "seatId", model: schema_names_1.names.Seat.singular_name },
            ]);
            return {
                event: populated.event,
                seat: populated.seat,
                priceTier: this.priceTier,
                purchased: this.purchaseInfo != undefined,
            };
        },
        async fullyPopulate() {
            return await this.populate([
                { path: "eventId", model: schema_names_1.names.Event.singular_name },
                { path: "seatId", model: schema_names_1.names.Seat.singular_name },
                { path: "purchaseInfo.purchaserId", model: schema_names_1.names.User.singular_name },
                { path: "paymentInfo.confirmerId", model: schema_names_1.names.User.singular_name },
            ]);
        },
    },
    query: {
        findByEventId(eventId) {
            let query = this;
            return query.where({
                eventId: eventId,
            });
        },
        findSold() {
            let query = this;
            return query.find({
                purchaseInfo: { $ne: null },
            });
        },
        findByPurchaser(userId) {
            let query = this;
            return query.find({
                purchaseInfo: { purchaserId: userId },
            });
        },
    },
});
exports.tickerSchema.pre('updateOne', { document: false, query: true }, () => {
    throw new Error("Please use find(ById) and chain save afterwards, as referential checking needs documents");
});
exports.tickerSchema.index({ eventId: 1, seatId: 1 }, { unique: true });
exports.ticketModel = (0, mongoose_1.model)(schema_names_1.names.Ticket.singular_name, exports.tickerSchema, schema_names_1.names.Ticket.collection_name);
exports.purchaseInfoModel = (0, mongoose_1.model)("Purchase", exports.purchaseInfoSchema);
exports.paymentInfoModel = (0, mongoose_1.model)("Payment", exports.paymentInfoSchema);
