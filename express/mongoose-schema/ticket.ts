import { eventModel, IEvent, IPriceTier, priceTierSchema } from "./event";
import {
  Schema,
  model,
  Types,
  Model,
  Query,
  UpdateQuery,
  HydratedDocument,
  QueryWithHelpers,
  ObjectId,
} from "mongoose";
import { ISeat, singular_name as Seat, seatModel } from "./seat";
import { singular_name as EventName } from "./event";
import { singular_name as User, userModel } from "./user";
import { notificationModel } from "./notification";
export interface IPurchaseInfo {
  purchaseDate: Date;
  purchaserId: Types.ObjectId;
}

export interface IPaymentInfo {
  confirmedBy: Types.ObjectId;
  remark: string;
  confirmationDate: Date;
}
export interface IDisclosableTicket {
  event: IEvent | null;
  seat: ISeat | null;
  priceTier: IPriceTier;
  purchased: boolean;
}
export interface IClientTicket extends IDisclosableTicket {
  belongsToUser: boolean;
}
export interface ITicket {
  eventId: Types.ObjectId;
  seatId: Types.ObjectId;
  priceTier: IPriceTier;
  purchaseInfo?: IPurchaseInfo;
  paymentInfo?: IPaymentInfo;
}

interface ITicketMethod {
  bulkPurchase(
    userId: string,
    ticketIds: string[]
  ): Promise<HydratedDocument<ITicket>[]>;
  batchUpdatePriceTier(
    ticketIds: string[],
    priceTier: IPriceTier | HydratedDocument<IPriceTier>
  ): Promise<HydratedDocument<ITicket>[]>;
  voidPurchased(operatorName: string): Promise<HydratedDocument<ITicket>>;
  checkOwner(userId: Types.ObjectId): Promise<IClientTicket>;
  disclose(): Promise<IDisclosableTicket>;
}
interface TickerQueryHelpers {
  findlByEventId(
    eventId: string
  ): QueryWithHelpers<
    HydratedDocument<ITicket>[],
    HydratedDocument<ITicket>,
    TickerQueryHelpers
  >;
  findSold(): QueryWithHelpers<
    HydratedDocument<ITicket>[],
    HydratedDocument<ITicket>,
    TickerQueryHelpers
  >;
  findByPurchaser(
    userId: string
  ): QueryWithHelpers<
    HydratedDocument<ITicket>[],
    HydratedDocument<ITicket>,
    TickerQueryHelpers
  >;
}

export interface TicketModel
  extends Model<ITicket, TickerQueryHelpers, ITicketMethod> {}
export const purchaseInfoSchema = new Schema<IPurchaseInfo>({
  purchaseDate: { type: Date, requried: true },
  purchaserId: {
    type: Schema.Types.ObjectId,
    ref: User,
    requried: true,
    validate: {
      validator: async (val: Schema.Types.ObjectId) => {
        return (await userModel.findById(val).select({ _id: 1 }).lean()) != null;
      },
      message: `${User} with id {VALUE} doesn't exists.`,
    },
  },
});
export const paymentInfoSchema = new Schema<IPaymentInfo>({
  confirmedBy: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
    validate: {
      validator: async (val: Schema.Types.ObjectId) => {
        let confimer = await userModel.findById(val);
        if (confimer == null)
          throw new Error(`${User} with id {VALUE} doesn't exists.`);
        if (!confimer._isAdmin && !confimer._isCustomerSupport)
          throw new Error(
            `${User} with id {VALUE} do not have such permission.`
          );
        return true;
      },
    },
  },
  remark: { type: String },
  confirmationDate: { type: Date, required: true },
});
export const tickerSchema = new Schema<
  ITicket,
  TicketModel,
  ITicketMethod,
  TickerQueryHelpers
>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: EventName,
      required: true,
      validate: {
        validator: async function (val: Types.ObjectId) {
          let event = await eventModel.findById(val);
          if (event == null)
            throw new Error(`Event with id ${val} doesn't exists.`);
          let priceTier = event.priceTiers.find(
            (p) => p.tierName == this.priceTier.tierName
          );
          if (priceTier == undefined || priceTier.price != this.priceTier.price)
            throw new Error(
              `Price tier ${this.priceTier.tierName} doesn't exists in associated event.`
            );
          return true;
        },
      },
    },
    seatId: {
      type: Schema.Types.ObjectId,
      ref: Seat,
      required: true,
      validate: {
        validator: async function (val: Types.ObjectId) {
          let seat = await seatModel.findById(val).select({ _id: 1 }).lean();
          if (seat == null)
            throw new Error(`Seat with id ${val} doesn't exists.`);

          return true;
        },
      },
    },
    priceTier: { type: priceTierSchema, required: true },
    purchaseInfo: { type: purchaseInfoSchema },
    paymentInfo: { type: paymentInfoSchema },
  },
  {
    methods: {
      async bulkPurchase(userId: string, ticketIds: string[]) {
        let ticketObjectIds = ticketIds.map(
          (id) => new Schema.Types.ObjectId(id)
        );
        let tickets = await ticketModel
          .find({ _id: ticketObjectIds })
          .lean()
          .exec();
        let events = await eventModel
          .find({ _id: tickets.map((t) => t.eventId) })
          .lean()
          .exec();
        if (events.length != 1)
          throw new Error(
            "Bulk purchase only supports buying tickets from exactly one event."
          );

        let event = events[0];
        if (ticketIds.length > event.shoppingCartSize)
          throw new Error(
            `Event with id ${event._id} have a shopping cart size limit at` +
              ` ${event.shoppingCartSize} but you are requesting ${ticketIds.length} tickets.`
          );
        let now = new Date();
        let saleInfo = event.saleInfos.find((info) => {
          info.start <= now && info.end >= new Date();
        });
        if (saleInfo == null)
          throw new Error(
            `Tickets of event with id ${event._id} is not selling yet.`
          );
        let baughtTicketCount = await ticketModel.countDocuments({
          "paymentInfo.purchaserId": userId,
        });
        if (baughtTicketCount >= saleInfo.ticketQuota)
          throw new Error(
            `You have no more ticket quota (${saleInfo.ticketQuota})` +
              ` for event with id ${event._id}.`
          );
        let purchaseInfo = new purchaseInfoMode({
          purchaserId: userId,
          purchaseDate: now,
        });
        purchaseInfo.validate();
        return ticketModel
          .updateMany(
            {
              _id: ticketObjectIds,
            },
            {
              $set: {
                purcahseInfo: purchaseInfo,
              },
            }
          )
          .then();
      },
      async batchUpdatePriceTier(
        ticketIds: string[],
        priceTier: IPriceTier | HydratedDocument<IPriceTier>
      ) {
        let ticketObjectIds = ticketIds.map(
          (id) => new Schema.Types.ObjectId(id)
        );
        let tickets = await ticketModel
          .find({ _id: ticketObjectIds })
          .lean()
          .exec();
        let events = await eventModel
          .find({ _id: tickets.map((t) => t.eventId) })
          .lean()
          .exec();
        if (events.length != 1)
          throw new Error(
            "Batch price tier update only supports updating tickets from exactly one event."
          );

        let event = events[0];
        let match = event.priceTiers.find((p) => {
          p.tierName == priceTier.tierName && p.price == priceTier.price;
        });
        if (match == null)
          throw new Error(
            `Tickes of event with id ${event._id} is not selling yet.`
          );
        return ticketModel
          .updateMany(
            {
              _id: ticketObjectIds,
            },
            {
              $set: {
                priceTier: match,
              },
            }
          )
          .then();
      },
      async voidPurchased(operatorName: string) {
        let purchaseInfo = this.purchaseInfo;
        if (purchaseInfo) {
          this.purchaseInfo = undefined;
          let purchaser = await userModel
            .findById(purchaseInfo.purchaserId)
            .then();
          let event = await eventModel.findById(this.eventId).then();
          let seat = await seatModel.findById(this.seatId).then();
          await this.save();
          if (purchaser != null && event != null && seat != null) {
            let salutation = purchaser.fullname
              ? `Dear ${purchaser.fullname}\n`
              : "";
            let customerSupportInfo = operatorName ? ` by ${operatorName}` : "";
            let purchaseDateInfo = purchaseInfo.purchaseDate
              ? ` (at ${purchaseInfo.purchaseDate.toLocaleString()})`
              : "";
            let notification = new notificationModel({
              recipientId: purchaser._id,
              email: purchaser.email,
              title: "Ticket Voided",
              message:
                salutation +
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
        throw new Error(`Ticker with id ${this._id} has not been sold yet.`);
      },
      async checkOwner(userId: Types.ObjectId) {
        let disclosable = await this.disclose();
        return {
          event: disclosable.event,
          seat: disclosable.seat,
          priceTier: this.priceTier,
          purchased: this.purchaseInfo != undefined,
          belongsToUser:
            this.purchaseInfo != undefined &&
            this.purchaseInfo.purchaserId == userId,
        };
      },
      async disclose() {
        let populated = await this.populate<IDisclosableTicket>([
          { path: "eventId", model: EventName },
          { path: "seatId", model: Seat },
        ]);
        return {
          event: populated.event,
          seat: populated.seat,
          priceTier: this.priceTier,
          purchased: this.purchaseInfo != undefined,
        };
      },
    },
    query: {
      findlByEventId(eventId: string) {
        let query = this as QueryWithHelpers<
          HydratedDocument<ITicket>[],
          HydratedDocument<ITicket>,
          TickerQueryHelpers
        >;
        return query.where({
          eventId: eventId,
        });
      },
      findSold() {
        let query = this as QueryWithHelpers<
          HydratedDocument<ITicket>[],
          HydratedDocument<ITicket>,
          TickerQueryHelpers
        >;
        return query.find({
          purchaseInfo: { $ne: null },
        });
      },
      findByPurchaser(userId: string) {
        let query = this as QueryWithHelpers<
          HydratedDocument<ITicket>[],
          HydratedDocument<ITicket>,
          TickerQueryHelpers
        >;
        return query.find({
          purchaseInfo: { purchaserId: userId },
        });
      },
    },
  }
);
tickerSchema.index({ eventId: 1, seatId: 1 }, { unique: true });
// tickerSchema.pre<Query<ITicket, TicketModel>>('updateMany', function (next) {
//     const update = this.getUpdate() as UpdateQuery<TicketModel>;
//     if (update && update.$set && update.$set.purchaseInfo) {

//     }
//     next();
// });

export const collection_name = "tickets";
export const singular_name = "Ticket";
export const ticketModel: TicketModel = model<ITicket, TicketModel>(
  singular_name,
  tickerSchema,
  collection_name
);
export const purchaseInfoMode = model("", purchaseInfoSchema);
export const paymentInfoModel = model("", paymentInfoSchema);
