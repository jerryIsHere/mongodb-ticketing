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
    return "purchaseInfo" in ticket && ticket.purchaseInfo != undefined ? ticket.purchaseInfo.purchaser :
        "purchased" in ticket ? ticket.purchased ? true : null
            : null
}
export function isTicketSelling(ticket: TicketAPIObject) {
    let purchaser = getPurchaserIfAny(ticket)
    return purchaser != true && typeof purchaser != "object"
}
export function ticketCompare(ticketA: TicketAPIObject, ticketB: TicketAPIObject, ascending: boolean = true): number {
    let aLargerThenb = null
    if (ticketA.priceTier.price > ticketA.priceTier.price) {
        aLargerThenb = true
    }
    else if (ticketA.priceTier.price > ticketA.priceTier.price) {
        aLargerThenb = false
    }
    else {
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
export function summarizeTicket<T extends AdminTicketAPIObject | ClientTicketAPIObject>(ticket: T[], show: ShowAPIObject) {
    let sortedPriceTier = show.priceTiers.sort((a, b) => {
        return a.price - b.price
    })
    let sortedTicket = [...ticket].sort(ticketCompareByDate)
    let summary = sortedTicket.reduce((summary, ticket, ind) => {
        if (ticket.purchaseInfo) {
            let purchaseDate = ticket.purchaseInfo.purchaseDate;

            let saleInfoInd = show.saleInfos.
                findIndex(info => info.start <= purchaseDate && purchaseDate <= info.end)
            let roundInfo = summary.round.get(saleInfoInd)
            let tierName = ticket.priceTier.tierName
            let price = ticket.priceTier.price
            if (roundInfo) {
                let tierInfo = roundInfo.tierInfo.get(tierName)
                if (tierInfo) {
                    tierInfo.count += 1
                    tierInfo.tickets.push(ticket)
                }
                else {
                    roundInfo.tierInfo.set(tierName, { tierName: tierName, count: 1, price: price, freed: 0, tickets: [ticket] })
                }
            }
            else {
                let tierInfo = new Map<string, { tierName: string, count: number, price: number, freed: number, tickets: T[] }>()
                tierInfo.set(tierName, { tierName: tierName, count: 1, price: price, freed: 0, tickets: [ticket] })
                summary.round.set(saleInfoInd, { count: 0, freed: 0, tierInfo: tierInfo, total: 0 })
            }

        }
        return summary
    }, {
        totalCost: 0,
        round: new Map<number,
            {
                count: number;
                freed: number;
                tierInfo: Map<string, {
                    tierName: string,
                    count: number,
                    price: number,
                    freed: number;
                    tickets: (T & { freed?: boolean })[]
                }>;
                total: number;
            }>()

    })
    summary.totalCost = Array.from(summary.round.entries()).map((round_info) => {
        let round = round_info[0]
        let roundInfo = round_info[1]
        let tierInfo = roundInfo.tierInfo
        let saleInfo
        if (round > -1 && round < show.saleInfos.length) {
            saleInfo = show.saleInfos[round]
            let buyX = saleInfo.buyX
            let yFree = saleInfo.yFree
            let totalTickerCount = Array.from(tierInfo.values()).map(info => info.count).reduce((acc: number, val: number) => acc + val, 0)
            let freeCount
            if (buyX == 0 || yFree == 0) {
                roundInfo.freed = 0
                roundInfo.count = totalTickerCount
                freeCount = 0
            }
            else {
                let quotient = Math.floor(totalTickerCount / (buyX + yFree))
                let reminder = totalTickerCount % (buyX + yFree)
                freeCount = quotient * yFree +
                    Math.max(reminder - buyX, 0)
                roundInfo.freed = freeCount
                roundInfo.count = totalTickerCount

            }
            for (let priceTier of sortedPriceTier) {
                let priceTierInfo = tierInfo.get(priceTier.tierName)
                if (!priceTierInfo) continue;
                if (freeCount <= 0) { }
                else {
                    priceTierInfo.freed = priceTierInfo.count < freeCount ? priceTierInfo.count : freeCount;
                    freeCount -= priceTierInfo.freed
                    priceTierInfo.tickets.sort(ticketCompare)
                    for (let i = 0; i < priceTierInfo.freed; i++) {
                        priceTierInfo.tickets[i].freed = true;
                    }
                    tierInfo.set(priceTier.tierName, priceTierInfo)
                }
                roundInfo.total += (priceTierInfo.count - priceTierInfo.freed) * priceTier.price
            }
            summary.round.set(round, roundInfo)
            return Array.from(tierInfo.values()).reduce((acc: number, pt) => acc + (pt.count - pt.freed) * pt.price, 0)
        }
        return 0
    }).reduce((acc: number, val: number) => acc + val, 0);
    console.log(summary)
    return summary
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