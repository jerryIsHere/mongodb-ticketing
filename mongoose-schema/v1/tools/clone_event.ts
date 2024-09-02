import { v1 } from '../../schema'
import { PriceTierDAO } from '../../../server/database/dao/priceTier'
import { Database } from '../../../server/database/database'
import { ObjectId } from 'mongodb'

import { seatModel } from '../seat'
import { eventModel } from '../event'
import { ticketModel } from '../ticket'
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
        // update search condition here!
        await v1.Event.eventModel.findOne({ eventname: "test" }).then(async oriEvent => {
            if (oriEvent) {

                console.log(`cloning ${oriEvent.eventname} `)
                let cloneEvent = new eventModel({ ...oriEvent.toJSON(), ...{ _id: undefined } })
                cloneEvent.eventname = `${cloneEvent.eventname} clone`
                let doc = await v1.Event.eventModel.findOne({ eventname: cloneEvent.eventname }).exec()
                if(doc){ throw new Error("cloning is done before")}
                await cloneEvent.save()

                v1.Ticket.ticketModel.find({
                    eventId: oriEvent._id,
                }).then(async oriTicket => {
                    for (let ticket of oriTicket) {
                        let cloneTicket = new ticketModel({
                            ...ticket.toJSON(), ...{
                                _id: undefined,
                                purchaseInfo: undefined,
                                paymentInfo: undefined
                            }
                        })
                        cloneTicket.eventId = cloneEvent._id
                        await cloneTicket.save()
                    }
                    return;
                })
            }
            else {
                throw new Error("no event found")
            }
        })

    })