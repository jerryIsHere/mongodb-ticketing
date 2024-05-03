import { Component, EventEmitter, Input, Output, SimpleChanges, booleanAttribute } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule, MatSelectChange } from '@angular/material/select'
import { FormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { PriceTier, Venue, Ticket, Seat } from '../../interface';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
const colorshex = "66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3" // 8 colors for pricetiers
type Section = { x: number, y: number }
@Component({
  selector: 'app-seating-plan',
  standalone: true,
  imports: [DragDropModule, MatTooltipModule, MatButtonModule, MatListModule, MatIconModule, MatChipsModule,
    MatSelectModule, FormsModule, MatCardModule, MatGridListModule, NgxImageZoomModule],
  templateUrl: './seating-plan.component.html',
  styleUrl: './seating-plan.component.scss'
})
export class SeatingPlanComponent {
  private _venue: Venue = { sections: [] }
  get venue() { return this._venue }
  @Input() set venue(value: Venue) {
    this._venue = value
    let sectionParam = this.activatedRoute.snapshot.queryParamMap.get('section')
    let section = { x: Number(sectionParam?.split("-")[0]), y: Number(sectionParam?.split("-")[1]) }
    if (Number.isInteger(section.x) && Number.isInteger(section.y)) {
      this.selectedSection = (this.venue.sections as Array<any>).find(s => s.x == section.x && s.y == section.y)
    }
    else if (value.sections && Array.isArray(value.sections) && this.tickets) {
      this.selectedSection = value.sections[0]
      for (let section of value.sections) {
        if (this.tickets.findIndex(ticket =>
          ticket.occupantId == null && ticket.seat &&
          ticket.seat.coord.sectX == section.x &&
          ticket.seat.coord.sectX == section.x) > -1) {
          this.selectedSection = section
          break
        }

      }
    }
    else if (value.sections) {
      this.selectedSection = value.sections[0]
    }

  }
  @Input()
  _selectedSection?: { x: number, y: number, options?: any }
  get selectedSection(): undefined | { x: number, y: number, options?: any } { return this._selectedSection }
  set selectedSection(value: { x: number, y: number, options?: any }) {
    this._selectedSection = value
    if (this.seats)
      this.render()
    this.clearSelectedSeat()
    this.selectedSectionChange.emit(value)
  }
  @Output() selectedSectionChange = new EventEmitter<{ x: number, y: number }>();
  private _selectedSeatIds: Set<string> = new Set<string>()
  clearSelectedSeat() {
    this._selectedSeatIds.clear()
  }
  get selectedSeatIds(): Set<string> { return this._selectedSeatIds }
  @Input()
  set selectedSeatIds(value: Set<string>) {
    value.forEach(id => {
      if (this.getBuyer(id) == null)
        this.addSelect(id)
    })
  }

  @Input({ transform: booleanAttribute }) soldTicketDisabled: boolean = false;

  @Input({ transform: booleanAttribute }) reservedSeatDisabled: boolean = false;

  @Output() selectedSeatIdsChange = new EventEmitter<Set<string>>();
  toggleSelect(seat: Seat | null) {
    if (seat) {
      let ticket = this.getTiceket(seat._id)
      let buyer = this.getBuyer(seat._id)
      let isTicketAvaliable = buyer === null || buyer === false || buyer == undefined
      let isSeatSelling = ticket != null
      if (
        !(this.soldTicketDisabled && !isTicketAvaliable) &&
        !(this.reservedSeatDisabled && !isSeatSelling)
      ) {
        if (this._selectedSeatIds.has(seat._id)) {
          this._selectedSeatIds.delete(seat._id)
          this.selectedSeatIdsChange.emit(this._selectedSeatIds)
        } else {
          this.addSelect(seat._id)
        }
      }
    }
  }
  addSelect(id: string): void {
    if (this.limit != undefined && this._selectedSeatIds.size >= this.limit) return;
    this._selectedSeatIds.add(id)
    this.selectedSeatIdsChange.emit(this._selectedSeatIds)
  }
  @Input()
  limit?: number
  isSeatSelected(id: string | undefined): undefined | boolean {
    if (id) return this._selectedSeatIds.has(id)
    return
  }
  _seats: Seat[] = []
  get seats(): Seat[] { return this._seats }
  @Input() set seats(value: Seat[]) {
    this._seats = value
    if (this.selectedSection)
      this.render()
  }
  @Input() tickets: Ticket[] = []
  @Input({ transform: booleanAttribute }) seatingPlanEditing: boolean = false;
  @Input({ transform: booleanAttribute }) isTicketPlanning: boolean = false;
  _priceTiers: PriceTier[] = []
  get priceTiers(): PriceTier[] { return this._priceTiers }
  @Input() set priceTiers(value: PriceTier[]) {
    this._priceTiers = value.sort(
      (a, b) => a.price && b.price && !Number.isNaN(Number(a.price)) && !Number.isNaN(Number(b.price)) ?
        Number(b.price) - Number(a.price) : 0)
    this.priceTiersColors = new Map<string, string>()
    var colors = "" + (' ' + colorshex).slice(1);
    for (let priceTier of value) {
      if (priceTier._id) {
        let c = colors.slice(0, 6)
        this.priceTiersColors.set(priceTier._id, c)
        if (colors.length <= 6) break;
        colors = colors.slice(6, colors.length)
      }
    }
  }
  priceTiersColors: Map<string, string> = new Map<string, string>()
  getColorByTicket(ticket: Ticket | null): undefined | string {
    if (ticket && ticket.priceTier && ticket.priceTier._id) return "#" + this.priceTiersColors.get(ticket.priceTier._id)
    return
  }
  cols: number[] = []
  rows: string[] = []
  slots: (Seat | undefined)[] = []
  seatColumnSorting: Map<string, Function> = new Map<string, Function>(
    [
      ["RTL", (a: number, b: number) => b - a],
      ["LTR", (a: number, b: number) => a - b],
    ]
  )
  seatRowSorting: Map<string, Function> = new Map<string, Function>(
    [
      ["BTT", function (a: string, b: string) { return b.localeCompare(a) }],
      ["TTB", function (a: string, b: string) { return a.localeCompare(b) }]
    ]
  )
  render() {
    console.log("rendering seating plan")
    let horizontalOrder = this.selectedSection?.options?.horizontalOrder
    horizontalOrder = this.seatColumnSorting.has(horizontalOrder) ? horizontalOrder : "LTR"
    horizontalOrder = this.seatColumnSorting.get(horizontalOrder)
    let verticleOrder = this.selectedSection?.options?.verticleOrder
    verticleOrder = this.seatRowSorting.has(verticleOrder) ? verticleOrder : "TTB"
    verticleOrder = this.seatRowSorting.get(verticleOrder)
    this.rows = Array.from(this.selectedSectionSeat().map((seat) => seat.row).reduce((rows, r, i) => rows.add(r), new Set<string>())).sort(verticleOrder)
    this.cols = Array.from(this.selectedSectionSeat().map((seat: Seat) => seat.no).reduce((rows, r, i) => rows.add(r), new Set<number>())).sort(horizontalOrder)
    this.slots = []
    for (let row of this.rows) {
      for (let col of this.cols) {
        this.slots.push(this.seats.find(seat => seat.no == col && seat.row == row))
      }
    }
  }
  // ngOnChangnges(changes: SimpleChanges) {
  //   this.init()
  //   if (changes["selectedSeatIds"]) this.selectedSeatIdsChange.emit(this._selectedSeatIds)
  // }
  // ngOnInit() {
  //   this.init()
  // }
  // init() {
  // }
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
  // should return null when ticket is not occupied
  getBuyer(rowOrSeatId: string, col?: number) {
    let ticket = this.getTiceket(rowOrSeatId, col)
    if (ticket)
      return ticket.occupant ? ticket.occupant : ticket.occupied ? true : null
    return null
  }

  selectedSectionSeat() {
    let filtered = this.seats?.filter(s => s.coord.sectX == this.selectedSection?.x && s.coord.sectY == this.selectedSection?.y)
    return filtered ? filtered : []
  }
  isSeatInSelectSection(row: string, col: number) {
    let seat = this.getSeat(row, col)
    if (seat) {

    }
    return seat && seat.coord.sectX == this.selectedSection?.x && seat.coord.sectY == this.selectedSection?.y
  }
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {

  }
  setRoute() {
    if (this.selectedSection && Number.isInteger(this.selectedSection.x) && Number.isInteger(this.selectedSection.y))
      this.router.navigate(
        [],
        {
          relativeTo: this.activatedRoute,
          queryParams: { section: this.selectedSection.x + '-' + this.selectedSection.y },
          queryParamsHandling: 'merge', // remove to replace all query params by provided
        }
      );
  }
}
