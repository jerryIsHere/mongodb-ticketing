// refer to Event of backend logic but renamed to Show to avoid name conflict with browser event javascript object
import { IEvent as Show, ISaleInfo } from '../../../mongoose-schema/v1/event'
import { IPriceTier } from '../../../mongoose-schema/v1/priceTier'
import { IDisclosableTicket, IClientTicket, IFullyPopulatedTicket as AdminTicket, IPopulatedPaymentInfo, IPopulatedPurchaseInfo } from '../../../mongoose-schema/v1/ticket'
import { ISeat as Seat } from '../../../mongoose-schema/v1/seat'
import { IDisclosableUser as User } from '../../../mongoose-schema/v1/user'
import { ISection, IVenue as Venue } from '../../../mongoose-schema/v1/venue'
export function
    isShowSelling(show: ShowAPIObject) {
    return show.saleInfos.filter(info => isShowSellingInThisRound(info)).length > 0
}
export function
    isShowSellingInThisRound(saleInfo: ISaleInfo) {
    let now = new Date()
    return (saleInfo.start && new Date(saleInfo.start) <= now && saleInfo.end && new Date(saleInfo.end) >= now)
}
export function getSellingInfo(show: ShowAPIObject) {
    return show.saleInfos.find(s => isShowSellingInThisRound(s))
}
export function showSellingString(saleInfos: ISaleInfo[]): string {
    return saleInfos.
        map(info => `${new Date(info.start).toLocaleDateString()}-${new Date(info.end).toLocaleDateString()}`).
        join("\n")

}
export function ticketConfirmDateString(ticket: AdminTicketAPIObject | ClientTicketAPIObject): string {
    return ticket.paymentInfo ? 'Ticket confirmed at ' + new Date(ticket.paymentInfo.confirmationDate).toLocaleDateString() : ''
}
export function ticketPurchaseDateString(ticket: AdminTicketAPIObject | ClientTicketAPIObject): string {
    return ticket.purchaseInfo ? new Date(ticket.purchaseInfo.purchaseDate).toLocaleDateString() : ''
}
export interface WithId {
    _id: string
}
export function getPurchaserIfAny(ticket: TicketAPIObject) {
    return "purchaseInfo" in ticket ? ticket.purchaseInfo?.purchaser : "purchased" in ticket ? ticket.purchased : null
}
export function ticketCompare(ticketA: TicketAPIObject, ticketB: TicketAPIObject, ascending: boolean = true): number {
    let aLargerThenb = null
    if(ticketA.priceTier.price > ticketA.priceTier.price){
        aLargerThenb = true
    }
    else if(ticketA.priceTier.price > ticketA.priceTier.price){
        aLargerThenb = false
    }
    else{
        if ("purchaseInfo" in ticketA && "purchaseInfo" in ticketB && ticketA.purchaseInfo && ticketB.purchaseInfo) {
            let aDate = new Date(ticketA.purchaseInfo.purchaseDate)
            let bDate = new Date(ticketB.purchaseInfo.purchaseDate)
            if (aDate > bDate) {
                aLargerThenb = true
            }
            else if (aDate < bDate) {
                aLargerThenb = false
            }
        }
        if ("purchaseInfo" in ticketA) {
            aLargerThenb = true
        }
        else if ("purchaseInfo" in ticketB) {
            aLargerThenb = false
        }
    }
    if ("purchaseInfo" in ticketA) {
        aLargerThenb = true
    }
    else if ("purchaseInfo" in ticketB) {
        aLargerThenb = false
    }
    if (aLargerThenb == null) return 0
    if (aLargerThenb) {
        return ascending ? 1 : -1
    }
    else {
        return ascending ? -1 : 1
    }
}
export function ticketCompareByDate(ticketA: TicketAPIObject, ticketB: TicketAPIObject, ascending: boolean = true): number {
    let aLargerThenb = null
    if ("purchaseInfo" in ticketA && "purchaseInfo" in ticketB && ticketA.purchaseInfo && ticketB.purchaseInfo) {
        let aDate = new Date(ticketA.purchaseInfo.purchaseDate)
        let bDate = new Date(ticketB.purchaseInfo.purchaseDate)
        if (aDate > bDate) {
            aLargerThenb = true
        }
        else if (aDate < bDate) {
            aLargerThenb = false
        }
    }
    if ("purchaseInfo" in ticketA) {
        aLargerThenb = true
    }
    else if ("purchaseInfo" in ticketB) {
        aLargerThenb = false
    }
    if (aLargerThenb == null) return 0
    if (aLargerThenb) {
        return ascending ? 1 : -1
    }
    else {
        return ascending ? -1 : 1
    }
}
type ShowAPIObject = Show & WithId
type PurchaseInfoAPIObject = IPopulatedPurchaseInfo<UserAPIObject> & WithId
type PaymentInfoAPIObject = IPopulatedPaymentInfo<UserAPIObject> & WithId
type PublicTicketAPIObject = IDisclosableTicket<ShowAPIObject, SeatAPIObject> & WithId
type AdminTicketAPIObject =
    AdminTicket<ShowAPIObject, SeatAPIObject, PurchaseInfoAPIObject, PaymentInfoAPIObject> & WithId
type ClientTicketAPIObject = IClientTicket<ShowAPIObject, SeatAPIObject> & WithId
type TicketAPIObject =
    PublicTicketAPIObject |
    ClientTicketAPIObject |
    AdminTicketAPIObject
type SeatAPIObject = Seat & WithId
type UserAPIObject = User & WithId
type VenueAPIObject = Venue & WithId
export {
    ShowAPIObject,
    IPriceTier,
    ISaleInfo,
    TicketAPIObject,
    SeatAPIObject,
    UserAPIObject,
    VenueAPIObject,
    ISection,
    ClientTicketAPIObject,
    AdminTicketAPIObject,
    IClientTicket,
    IDisclosableTicket
}