import { Component, EventEmitter, Input, Output, SimpleChanges, booleanAttribute } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule, MatSelectChange } from '@angular/material/select'
import { FormsModule } from '@angular/forms';
import { PriceTier, Venue } from '../../management-panel/management-panel.component';
const colorshex = "66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3" // 8 colors for pricetiers
type Section = { x: number, y: number }
@Component({
  selector: 'app-seating-plan',
  standalone: true,
  imports: [DragDropModule, MatTooltipModule, MatButtonModule, MatListModule, MatIconModule, MatChipsModule, MatSelectModule, FormsModule],
  templateUrl: './seating-plan.component.html',
  styleUrl: './seating-plan.component.scss'
})
export class SeatingPlanComponent {
  @Input() venue: Venue = { sections: [] }
  selectedSection?: { x: number, y: number }
  @Input()
  selectedSeatIds: Set<string> = new Set<string>()
  @Output() selectedSeatIdsChange = new EventEmitter<Set<string>>();
  toggleSelect(seat: Seat | null) {
    if (seat) this.selectedSeatIds.has(seat._id) ? this.selectedSeatIds.delete(seat._id) : this.selectedSeatIds.add(seat._id)
    this.selectedSeatIdsChange.emit(this.selectedSeatIds)
  }
  isSeatSelected(id: string | undefined): undefined | boolean {
    if (id) return this.selectedSeatIds.has(id)
    return
  }
  @Input() seats: Seat[] = []
  @Input() tickets: Ticket[] = []
  @Input({ transform: booleanAttribute }) seatingPlanEditing: boolean = false;
  @Input({ transform: booleanAttribute }) isTicketPlanning: boolean = false;
  @Input() priceTiers: PriceTier[] | undefined
  priceTiersColors: Map<string, string> = new Map<string, string>()
  getColorByTicket(ticket: Ticket | null): undefined | string {
    if (ticket && ticket.priceTier && ticket.priceTier._id) return "#" + this.priceTiersColors.get(ticket.priceTier._id)
    return
  }
  cols: number[] = []
  rows: string[] = []
  slots: (Seat | undefined)[] = []
  render() {
    this.rows = Array.from(this.selectedSectionSeat().map((seat) => seat.row).reduce((rows, r, i) => rows.add(r), new Set<string>())).sort(function (a, b) { return b.localeCompare(a) })
    this.cols = Array.from(this.selectedSectionSeat().map((seat: Seat) => seat.no).reduce((rows, r, i) => rows.add(r), new Set<number>())).sort(function (a, b) { return b - a })
    this.slots = []
    for (let row of this.rows) {
      for (let col of this.cols) {
        this.slots.push(this.seats.find(seat => seat.no == col && seat.row == row))
      }
    }
  }
  ngOnChangnges(changes: SimpleChanges) {
    console.log(changes)
    this.init()
    if(changes["selectedSeatIds"]) this.selectedSeatIdsChange.emit(this.selectedSeatIds)
  }
  ngOnInit() {
    this.init()
  }
  init() {
    if (this.venue && this.venue.sections && this.venue.sections.length > 0) {
      this.selectedSection = this.venue?.sections[0]
    }
    if (this.seats) {
      this.render()
    }
    if (this.priceTiers) {
      this.priceTiersColors = new Map<string, string>()
      var colors = "" + (' ' + colorshex).slice(1);
      for (let priceTier of this.priceTiers) {
        if (priceTier._id) {
          let c = colors.slice(0, 6)
          this.priceTiersColors.set(priceTier._id, c)
          if (colors.length <= 6) break;
          colors = colors.slice(6, colors.length)
        }
      }
    }
  }
  compareSection(option: Section, value: Section) { return option.x == value.x && option.y == value.y }
  getSeat(row: string, col: number) {
    var search = this.seats.filter(s => s.row == row && s.no == col)
    return search.length > 0 ? search[0] : null
  }
  getTiceket(rowOrSeatId: string, col?: number): Ticket | null {
    let seatId: string | null = null
    if (rowOrSeatId && col) {
      let seat = this.getSeat(rowOrSeatId, col)
      seatId = seat && seat._id ? seat._id : null
    }
    else {
      seatId = rowOrSeatId
    }
    if (seatId) {
      let search = this.tickets.filter(es => es.seatId == seatId)
      if (search.length > 0)
        return search[0]
    }
    return null
  }
  getBuyer(rowOrSeatId: string, col?: number) {
    let ticket = this.getTiceket(rowOrSeatId, col)
    if (ticket)
      return ticket.occupant ? ticket.occupant : ticket.occupied
    return null
  }

  selectedSectionSeat() {
    let filtered = this.seats?.filter(s => s.coord.sectX == this.selectedSection?.x && s.coord.sectY == this.selectedSection?.y)
    return filtered ? filtered : []
  }
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
  occupantId: string
  priceTier: PriceTier,
  occupied?: boolean
  occupant?: any
  _id: string
}