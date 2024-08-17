import { eventModel, IEvent } from "./event";
import { IPriceTier, priceTierSchema } from './priceTier';
import {
  Schema,
  model,
  Types,
  Model,
  HydratedDocument,
  QueryWithHelpers,
} from "mongoose";
import { ISeat, ISeatMethod, seatModel } from "./seat";
import { IUser, userModel } from "./user";
import { notificationModel } from "./notification";
import { names } from "../schema-names";
import { OperationError, ReferentialError } from "../error";
export interface IPurchaseInfo {
  purchaseDate: Date;
  purchaserId: Types.ObjectId;
}
export interface IPopulatedPurchaseInfo<TUser = HydratedDocument<IUser>> {
  purchaseDate: Date;
  purchaser: TUser | null;
}
export const vendors = ["fps", "payme", "wechatpay", "alipay", "free"]
export type MicrotransctionVendor = "fps" | "payme" | "wechatpay" | "alipay" | "free";
export interface IPaymentInfo {
  confirmerId: Types.ObjectId;
  confirmedBy: MicrotransctionVendor;
  remark?: string;
  confirmationDate: Date;
}
export interface IPopulatedPaymentInfo<TUser = HydratedDocument<IUser>> {
  confirmer: TUser | null;
  confirmedBy: MicrotransctionVendor;
  remark?: string;
  confirmationDate: Date;
}

export interface IBasePopulatedTicket<TEvent = HydratedDocument<IEvent>, TSeat = HydratedDocument<ISeat>,> {
  event: TEvent | null;
  seat: TSeat | null;
  priceTier: IPriceTier;
}
export interface IDisclosableTicket<TEvent = HydratedDocument<IEvent>, TSeat = HydratedDocument<ISeat>> extends IBasePopulatedTicket<TEvent, TSeat> {
  purchased: boolean;
  _id: Types.ObjectId | string;
}
export interface IClientTicket<TEvent = HydratedDocument<IEvent>, TSeat = HydratedDocument<ISeat>> extends IDisclosableTicket<TEvent, TSeat> {
  belongsToUser: boolean;
}
export interface IFullyPopulatedTicket<TEvent = HydratedDocument<IEvent>,
  TSeat = HydratedDocument<ISeat>,
  TPurchaseInfo = HydratedDocument<IPopulatedPurchaseInfo>,
  TPaymentInfo = HydratedDocument<IPopulatedPaymentInfo>,
> extends IBasePopulatedTicket<TEvent, TSeat> {
  purchaseInfo?: TPurchaseInfo;
  paymentInfo?: TPaymentInfo;
}

export interface ITicket {
  eventId: Types.ObjectId;
  seatId: Types.ObjectId;
  priceTier: IPriceTier;
  purchaseInfo?: IPurchaseInfo;
  paymentInfo?: IPaymentInfo;
}
interface ITicketMethod {
  voidPurchased(operatorName: string): Promise<HydratedDocument<ITicket>>;
  discloseToClient(userId: Types.ObjectId): Promise<IClientTicket>;
  disclose(): Promise<IDisclosableTicket>;
  fullyPopulate(): Promise<IFullyPopulatedTicket<IEvent, ISeat, IPopulatedPurchaseInfo<IUser>, IPopulatedPaymentInfo<IUser>>>
}
interface HydratedTicket extends HydratedDocument<ITicket, ITicketMethod, TickerQueryHelpers> { }
interface TickerQueryHelpers {
  findByEventId(
    eventId: string
  ): QueryWithHelpers<
    HydratedTicket[],
    HydratedTicket,
    TickerQueryHelpers
  >;
  findSold(): QueryWithHelpers<
    HydratedTicket[],
    HydratedTicket,
    TickerQueryHelpers
  >;
  findByPurchaser(
    userId: string
  ): QueryWithHelpers<
    HydratedTicket[],
    HydratedTicket,
    TickerQueryHelpers
  >;
}

export interface TicketModel
  extends Model<ITicket, TickerQueryHelpers, ITicketMethod> {
  bulkPurchase(
    userId: string,
    ticketIds: string[]
  ): Promise<HydratedTicket[]>;
  batchUpdatePriceTier(
    ticketIds: string[],
    tierName: string,
  ): Promise<HydratedTicket[]>;
}
export const purchaseInfoSchema = new Schema<IPurchaseInfo>({
  purchaseDate: { type: Date, requried: true },
  purchaserId: {
    type: Schema.Types.ObjectId,
    ref: names.User.singular_name,
    requried: true,
    validate: {
      validator: async (val: Schema.Types.ObjectId) => {
        return (await userModel.findById(val).select({ _id: 1 }).lean()) != null;
      },
      message: `${names.User.singular_name} with id {VALUE} doesn't exists.`,
    },
  },
}, {
  autoCreate: false,
  autoIndex: false,
});
function checkVendorName(vendor: string): vendor is MicrotransctionVendor {
  return vendors.includes(vendor);
}
export const paymentInfoSchema = new Schema<IPaymentInfo>({
  confirmerId: {
    type: Schema.Types.ObjectId,
    ref: names.User.singular_name,
    required: true,
    validate: {
      validator: async (val: Schema.Types.ObjectId) => {
        let confimer = await userModel.findById(val);
        if (confimer == null)
          throw new ReferentialError(`${names.User.singular_name} with id {VALUE} doesn't exists.`);
        if (!confimer._isAdmin && !confimer._isCustomerSupport)
          throw new ReferentialError(
            `${names.User.singular_name} with id {VALUE} do not have such permission.`
          );
        return true;
      },
    },
  },
  confirmedBy: {
    type: String,
    required: true,
    validate: {
      validator: async (val: string) => checkVendorName(val),
      message: "Payment confirmation {VALUE} is not recongized"
    },
  },
  remark: { type: String },
  confirmationDate: { type: Date, required: true },
}, {
  autoCreate: false,
  autoIndex: false,
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
      ref: names.Event.singular_name,
      required: true,
      validate: {
        validator: async function (val: Types.ObjectId) {
          let event = await eventModel.findById(val);
          if (event == null)
            throw new ReferentialError(`Event with id ${val} doesn't exists.`);
          let priceTier = event.priceTiers.find(
            (p) => p.tierName == this.priceTier.tierName
          );
          // validate priceTier here such that we don't fetch associated event twice in validation step
          // to reduce round-trip time
          if (priceTier == undefined || priceTier.price != this.priceTier.price)
            throw new ReferentialError(
              `Price tier ${this.priceTier.tierName} doesn't exists in associated event.`
            );
          return true;
        },
      },
    },
    seatId: {
      type: Schema.Types.ObjectId,
      ref: names.Seat.singular_name,
      required: true,
      validate: {
        validator: async function (val: Types.ObjectId) {
          let seat = await seatModel.findById(val).select({ _id: 1 }).lean();
          if (seat == null)
            throw new ReferentialError(`Seat with id ${val} doesn't exists.`);

          return true;
        },
      },
    },
    priceTier: { type: priceTierSchema, required: true },
    purchaseInfo: { type: purchaseInfoSchema },
    paymentInfo: { type: paymentInfoSchema },
  },
  {
    statics: {

      async bulkPurchase(userId: string, ticketIds: string[]) {
        let ticketObjectIds = ticketIds.map(
          (id) => new Types.ObjectId(id)
        );
        let tickets = await ticketModel.find({ _id: { $in: ticketObjectIds }, purchaseInfo: { $exists: false } }).exec()
        if (tickets.length != ticketIds.length) {
          let idsPurchaseable = tickets.map(model => model._id.toString());
          let idsNotPurchaseable = ticketIds.filter(id => !idsPurchaseable.includes(id))
          throw new OperationError(
            `Ticket${idsNotPurchaseable.length > 1 ? 's' : ''} with id ` +
            idsNotPurchaseable.join(', ') +
            `ha${idsNotPurchaseable.length > 1 ? 's' : 've'} been sold.`
          );
        }
        let events = await eventModel
          .find({ _id: { $in: tickets.map((t) => t.eventId) } })
          .lean()
          .exec();
        if (events.length != 1)
          throw new OperationError(
            "Bulk purchase only supports buying tickets from exactly one event."
          );

        let event = events[0];
        if (ticketIds.length > event.shoppingCartSize)
          throw new ReferentialError(
            `Event with id ${event._id} have a shopping cart size limit at` +
            ` ${event.shoppingCartSize} but you are requesting ${ticketIds.length} tickets.`
          );
        let now = new Date();
        let saleInfo = event.saleInfos.find((info) => {
          return info.start <= now && info.end >= new Date();
        });
        if (saleInfo == null)
          throw new OperationError(
            `Tickets of event with id ${event._id} is not selling yet.`
          );
        let userTicketForEventCount = await ticketModel.countDocuments({
          "paymentInfo.purchaserId": userId,
        });
        if (userTicketForEventCount + ticketIds.length >= saleInfo.ticketQuota)
          throw new OperationError(
            `You have no more ticket quota (${saleInfo.ticketQuota})` +
            ` for event with id ${event._id}.`
          );
        let purchaseInfo = new purchaseInfoModel({
          purchaserId: userId,
          purchaseDate: now,
        });
        purchaseInfo.validate();
        let purchasedTicket = await Promise.all(
          tickets.map(ticket => {
            ticket.purchaseInfo = purchaseInfo;
            // validation done with purchaseInfo.validate() and only one filed of ticket is modified.
            // purchaseinfo.validate requires finding user in db, and is slightly expensive
            return ticket.save({ validateBeforeSave: false })
          }))

        return purchasedTicket
      },
      async batchUpdatePriceTier(
        ticketIds: string[],
        tierName: string,
      ) {
        let ticketObjectIds = ticketIds.map(
          (id) => new Types.ObjectId(id)
        );
        let tickets = await ticketModel
          .find({ _id: { $in: ticketObjectIds } })
          .lean()
          .exec();
        let events = await eventModel
          .find({ _id: { $in: tickets.map((t) => t.eventId) } })
          .lean()
          .exec();
        if (events.length != 1)
          throw new OperationError(
            "Batch price tier update only supports updating tickets from exactly one event."
          );

        let event = events[0];
        let match = event.priceTiers.find((p) => {
          p.tierName == tierName
        });
        if (match == null)
          throw new ReferentialError(
            `Event with id ${event._id} does not have a price tier called ${tierName}.`
          );
        return ticketModel
          .updateMany(
            { _id: { $in: ticketObjectIds } },
            {
              $set: {
                priceTier: match,
              },
            }
          )
          .then();
      },
    },
    methods: {
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
        throw new OperationError(`Ticker with id ${this._id} has not been sold yet.`);
      },
      async discloseToClient(userId: Types.ObjectId) {
        let disclosable = await this.disclose();
        return {
          _id: this._id,
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
        let populated = await this.populate<IDisclosableTicket>(["event", "seat"]);
        return {
          _id: this._id,
          event: populated.event,
          seat: populated.seat,
          priceTier: this.priceTier,
          purchased: this.purchaseInfo != undefined,
        };
      },
      async fullyPopulate() {
        let populated = await this.populate<IFullyPopulatedTicket>([
          "event",
          "seat",
          "purchaseInfo.purchaser",
          "paymentInfo.confirmer"])
        let populatedPurchaseInfo: IPopulatedPurchaseInfo<IUser> | undefined = populated.purchaseInfo ?
          {
            ...populated.purchaseInfo.toJSON(),
            ...{ purchaser: populated.purchaseInfo.purchaser }
          } : undefined
        let populatedPaymentInfo: IPopulatedPaymentInfo<IUser> | undefined =
          populated.paymentInfo
            ? {
              ...populated.paymentInfo.toJSON(), ...{ confirmer: populated.paymentInfo.confirmer }
            } : undefined
        return {
          _id: populated._id,
          event: populated.event,
          seat: populated.seat,
          priceTier: populated.priceTier,
          purchaseInfo: populatedPurchaseInfo,
          paymentInfo: populatedPaymentInfo,
        }
      },
    },
    query: {
      findByEventId(eventId: string) {
        let query = this as QueryWithHelpers<
          HydratedTicket[],
          HydratedTicket,
          TickerQueryHelpers
        >;
        return query.where({
          eventId: eventId,
        });
      },
      findSold() {
        let query = this as QueryWithHelpers<
          HydratedTicket[],
          HydratedTicket,
          TickerQueryHelpers
        >
        return query.find({
          purchaseInfo: { $ne: null },
        });
      },
      findByPurchaser(userId: string) {
        let query = this as QueryWithHelpers<
          HydratedTicket[],
          HydratedTicket,
          TickerQueryHelpers
        >;
        return query.find({
          purchaseInfo: { purchaserId: userId },
        });
      },
    },
  }
);
purchaseInfoSchema.virtual('purchaser', {
  ref: names.User.singular_name,
  localField: 'purchaserId',
  foreignField: '_id',
  justOne: true
})
paymentInfoSchema.virtual('confirmer', {
  ref: names.User.singular_name,
  localField: 'confirmerId',
  foreignField: '_id',
  justOne: true
})
tickerSchema.virtual('event', {
  ref: names.Event.singular_name,
  localField: 'eventId',
  foreignField: '_id',
  justOne: true
})
tickerSchema.virtual('seat', {
  ref: names.Seat.singular_name,
  localField: 'seatId',
  foreignField: '_id',
  justOne: true
})
tickerSchema.pre('updateOne', { document: false, query: true }, () => {
  throw new Error(
    "Please use find(ById) and chain save afterwards, as referential checking needs documents")
})
tickerSchema.index({ eventId: 1, seatId: 1 }, { unique: true });

export const ticketModel: TicketModel = model<ITicket, TicketModel>(
  names.Ticket.singular_name,
  tickerSchema,
  names.Ticket.collection_name
);
export const purchaseInfoModel = model("Purchase", purchaseInfoSchema);
export const paymentInfoModel = model("Payment", paymentInfoSchema);
