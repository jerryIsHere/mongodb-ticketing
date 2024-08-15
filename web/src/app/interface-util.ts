// refer to Event of backend logic but renamed to Show to avoid name conflict with browser event javascript object
import { IEvent as Show, ISaleInfo } from '../../../mongoose-schema/v1/event'
import { IPriceTier } from '../../../mongoose-schema/v1/priceTier'
import { IDisclosableTicket, IClientTicket, IFullyPopulatedTicket as AdminTicket } from '../../../mongoose-schema/v1/ticket'
import { ISeat as Seat } from '../../../mongoose-schema/v1/seat'
import { IDisclosableUser as User } from '../../../mongoose-schema/v1/user'
import { ISection, IVenue as Venue } from '../../../mongoose-schema/v1/venue'
export function
    isShowSelling(show: ShowAPIObject) {
    return show.saleInfos.filter(info => isShowSellingInThisRound(info)).length > 1
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
export function ticketConfirmDateString(ticket: AdminTicket<ShowAPIObject, SeatAPIObject>): string {
    return ticket.paymentInfo ? 'Ticket confirmed at ' + new Date(ticket.paymentInfo.confirmationDate).toLocaleDateString() : ''
}
export function ticketPurchaseDateString(ticket: AdminTicket<ShowAPIObject, SeatAPIObject>): string {
    return ticket.purchaseInfo ? new Date(ticket.purchaseInfo.purchaseDate).toLocaleDateString() : ''
}
export interface WithId {
    _id: string
}
export function getPurchaserIfAny(ticket: TicketAPIObject) {
    return "purchaseInfo" in ticket ? ticket.purchaseInfo?.purchaser : "purchased" in ticket ? ticket.purchased : null
}
type ShowAPIObject = Show & WithId
type TicketAPIObject =
    (IDisclosableTicket<ShowAPIObject, SeatAPIObject> & WithId) |
    (IClientTicket<ShowAPIObject, SeatAPIObject> & WithId) |
    (AdminTicket<ShowAPIObject, SeatAPIObject> & WithId)
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
    AdminTicket,
    IClientTicket,
    IDisclosableTicket
}