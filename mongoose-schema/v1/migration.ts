import { v1 } from '../schema'
import { PriceTierDAO } from '../../server/database/dao/priceTier'
import { Database } from '../../server/database/database'
import { ObjectId } from 'mongodb'
import { paymentInfoModel, purchaseInfoModel } from './ticket'
import { IPriceTier } from './priceTier'
import { userModel } from './user'
declare namespace process {
    namespace env {
        let mongo_username: string
        let mongo_password: string
        let mongo_url: string | undefined
        let PORT: string | null
    }
}

Promise.all([Database.init()])
    .catch(e => {
        console.error(e)
    })
    .finally(async () => {
        console.log("start migration")
        let priceTiers = (await PriceTierDAO.listAll({} as any))
        let priceTierWithId = priceTiers.map(p => p.Hydrated());
        console.log(priceTierWithId)
        let priceTierWithOutId = priceTiers.map(p => p.Serialize(false));
        await v1.Event.eventModel.find({}).then(async docs => {
            for (let doc of docs) {
                doc.priceTiers = priceTierWithId as any
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
                }]
                await doc.save({ validateBeforeSave: false })
            }
        })
        await v1.Ticket.ticketModel.find({}).then(async docs => {
            for (let doc of docs) {
                if (doc.get("remark")) {
                    doc.paymentInfo = new paymentInfoModel({
                        confirmationDate: doc.get("confirmationDate") ? doc.get("confirmationDate") : new Date(),
                        confirmedBy: doc.get("confirmedBy"),
                        confirmerId: doc.get("confirmerId") ? doc.get("confirmerId") : new ObjectId("6629e5b2108208b0675ce1bd"),
                        remark: doc.get("remark")
                    })
                }
                if (doc.get("occupantId")) {
                    doc.purchaseInfo = new purchaseInfoModel({
                        purchaseDate: doc.get("purchaseDate"),
                        purchaserId: doc.get("occupantId"),
                    })
                }
                doc.priceTier = priceTierWithId.find(pt => (pt as any)._id.equals(doc.get("priceTierId"))) as IPriceTier
                await doc.save({ validateBeforeSave: false })
            }
        })
        await userModel.updateMany({ isAdmin: true }, {
            $set: {
                _isAdmin: true
            }
        }).exec()
        await userModel.updateMany({ isCustomerSupport: true }, {
            $set: {
                _isCustomerSupport: true
            }
        }).exec()
        console.log("migrate event")
        v1.Event.eventModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())))
        console.log("migrate notification")
        v1.Notification.notificationModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())))
        console.log("migrate seat")
        v1.Seat.seatModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())))
        console.log("migrate venue")
        v1.Venue.venueModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())))
        console.log("migrate user")
        v1.User.userModel.find({}).then(docs => Promise.all(docs.map(doc => doc.validate())))
    })