// refer to Event of backend logic but renamed to Show to avoid name conflict with browser event javascript object
export interface Show {
    eventname?: string;
    datetime?: Date;
    duration?: number;
    venueId?: string;
    venue?: Venue;
    _id?: string;
    startFirstRoundSellDate?: Date;
    endFirstRoundSellDate?: Date
    startSecondRoundSellDate?: Date;
    endSecondRoundSellDate?: Date;
    shoppingCartSize?: number;
    firstRoundTicketQuota?: number;
    secondRoundTicketQuota?: number;
}
export function
    isShowSelling(show: Show) {
    return isShowSellingAsFirstRound(show) || isShowSellingAsSecondROund(show)
}
export function
    isShowSellingAsFirstRound(show: Show) {
    return (show.startFirstRoundSellDate && new Date(show.startFirstRoundSellDate) <= new Date() && show.endFirstRoundSellDate && new Date(show.endFirstRoundSellDate) >= new Date())
}
export function
    isShowSellingAsSecondROund(show: Show) {
    return (show.startSecondRoundSellDate && new Date(show.startSecondRoundSellDate) <= new Date() && show.endSecondRoundSellDate && new Date(show.endSecondRoundSellDate) >= new Date())
}

export function showSellingString(show: Show): string {
    if (show.startFirstRoundSellDate && show.endFirstRoundSellDate && show.startSecondRoundSellDate && show.endSecondRoundSellDate)
        return `${new Date(show.startFirstRoundSellDate).toLocaleDateString()}-${new Date(show.endFirstRoundSellDate).toLocaleDateString()}
${new Date(show.startSecondRoundSellDate).toLocaleDateString()}-${new Date(show.endSecondRoundSellDate).toLocaleDateString()}`
    return ''
}
export interface Venue {
    venuename?: string;
    sections?: { x: number, y: number }[]
    _id?: string;
}
export interface PriceTier {
    tierName?: string;
    price?: number;
    _id?: string;
}
export interface Seat {
    row: string
    no: number
    venueId: string
    _id: string
    coord: { orderInRow: number, sectX: number, sectY: number }
}
export interface Ticket {
    eventId: string,
    seatId: string,
    priceTierId: string,
    occupantId: string | null,
    priceTier: PriceTier,
    seat?: Seat,
    event?: Show,
    occupied?: boolean,
    occupant?: any,
    _id: string,
    securedBy?: string | null,
    remark?: string | null,
}