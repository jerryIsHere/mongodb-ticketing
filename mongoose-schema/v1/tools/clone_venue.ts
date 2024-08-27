import { v1 } from '../../schema'
import { PriceTierDAO } from '../../../server/database/dao/priceTier'
import { Database } from '../../../server/database/database'
import { ObjectId } from 'mongodb'
import { ISection, venueModel } from '../venue'
import { seatModel } from '../seat'
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
        let venueName = "CityHall Concert Hall"
        let sections: ISection[] = [
            { x: 1, y: 1, options: {} },
            { x: 1, y: 2, options: {} },
            { x: 1, y: 3, options: {} },
            { x: 2, y: 1, options: {} },
            { x: 2, y: 2, options: {} },
            { x: 2, y: 3, options: {} }]
        console.log(`cloning ${venueName} with`)
        await v1.Venue.venueModel.findOne({ venuename: venueName }).then(async oriVenue => {
            if (oriVenue) {
                let filteredSections = oriVenue.sections.filter(s => sections.find(ss => ss.x == s.x && ss.y == s.y))
                let cloneVenue = new venueModel({ ...oriVenue.toJSON(), ...{ _id: undefined, sections: filteredSections } })
                console.log(cloneVenue.sections.map(s => `${s.x}-${s.y}`).join(', '))
                cloneVenue.venuename = `${venueName} without balcony`
                await cloneVenue.save()

                v1.Seat.seatModel.find({
                    venueId: oriVenue._id,
                    $or: sections.map(s => {
                        return { "coord.sectX": s.x, "coord.sectY": s.y }
                    })
                }).then(async oriSeat => {
                    oriSeat
                    for (let seat of oriSeat) {
                        let cloneSeat = new seatModel({ ...seat.toJSON(), ...{ _id: undefined } })
                        cloneSeat.venueId = cloneVenue._id
                        await cloneSeat.save()
                    }
                })
            }
        })

    })