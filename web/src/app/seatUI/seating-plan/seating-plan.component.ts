import { Component, ElementRef, EventEmitter, Input, NgZone, Output, SimpleChanges, ViewChild, booleanAttribute } from '@angular/core';
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
import { IPriceTier, VenueAPIObject, TicketAPIObject, SeatAPIObject, ISection, getPurchaserIfAny } from '../../api-util';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

const colorshex = "66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3" // 8 colors for pricetiers
type Section = { x: number, y: number }
@Component({
  selector: 'app-seating-plan',
  standalone: true,
  imports: [DragDropModule, MatTooltipModule, MatButtonModule, MatListModule, MatIconModule, MatChipsModule,
    MatSelectModule, FormsModule, MatCardModule, MatGridListModule],
  templateUrl: './seating-plan.component.html',
  styleUrl: './seating-plan.component.scss'
})
export class SeatingPlanComponent {
  private _venue: VenueAPIObject | undefined
  get venue(): VenueAPIObject | undefined { return this._venue }
  @Input() set venue(value: VenueAPIObject) {
    this._venue = value
    this.tryInitialSectionSelection()
  }
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

  _ticketIrrelavent: boolean = false;
  @Input({ transform: booleanAttribute })
  set ticketIrrelavent(value: boolean) {
    this._ticketIrrelavent = value
    if (value) this.tickets = []
  }

  @Output() selectedSeatIdsChange = new EventEmitter<Set<string>>();
  toggleSelect(seat: SeatAPIObject | null) {
    if (seat) {
      let ticket = this.getTiceket(seat._id)
      let buyer = this.getBuyer(seat._id)
      let isTicketAvaliable = buyer === null
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
  _seats: SeatAPIObject[] = []
  get seats(): SeatAPIObject[] { return this._seats }
  @Input() set seats(value: SeatAPIObject[]) {
    this._seats = value
    if (this.selectedSection)
      this.render()
  }
  _tickets?: TicketAPIObject[]
  get tickets(): TicketAPIObject[] | undefined { return this._tickets }
  @Input() set tickets(value: TicketAPIObject[]) {
    this._tickets = value
    this.tryInitialSectionSelection()
  }
  @Input({ transform: booleanAttribute }) seatingPlanEditing: boolean = false;
  @Input({ transform: booleanAttribute }) isTicketPlanning: boolean = false;
  _priceTiers: IPriceTier[] = []
  get priceTiers(): IPriceTier[] { return this._priceTiers }
  @Input() set priceTiers(value: IPriceTier[]) {
    this._priceTiers = value.sort(
      (a, b) => a.price && b.price && !Number.isNaN(Number(a.price)) && !Number.isNaN(Number(b.price)) ?
        Number(b.price) - Number(a.price) : 0)
    this.priceTiersColors = new Map<string, string>()
    var colors = "" + (' ' + colorshex).slice(1);
    for (let priceTier of value) {
      let c = colors.slice(0, 6)
      this.priceTiersColors.set(priceTier.tierName, c)
      if (colors.length <= 6) break;
      colors = colors.slice(6, colors.length)
    }
  }
  priceTiersColors: Map<string, string> = new Map<string, string>()
  getColorByTicket(ticket: TicketAPIObject | null): undefined | string {
    if (ticket && ticket.priceTier && ticket.priceTier.tierName) return "#" + this.priceTiersColors.get(ticket.priceTier.tierName)
    return
  }
  cols: number[] = []
  rows: string[] = []
  slots: (SeatAPIObject | undefined)[] = []
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
    this.cols = Array.from(this.selectedSectionSeat().map((seat: SeatAPIObject) => seat.no).reduce((rows, r, i) => rows.add(r), new Set<number>())).sort(horizontalOrder)
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
  getTiceket(rowOrSeatId: string, col?: number): TicketAPIObject | null {
    let seatId: string | null = null
    if (rowOrSeatId && col) {
      let seat = this.getSeat(rowOrSeatId, col)
      seatId = seat && seat._id ? seat._id : null
    }
    else {
      seatId = rowOrSeatId
    }
    if (seatId && this.tickets) {
      let search = this.tickets.filter(es => es.seat?._id.toString() == seatId)
      if (search.length > 0)
        return search[0]
    }
    return null
  }
  // should return null when ticket is not occupied
  getBuyer(rowOrSeatId: string, col?: number) {
    let ticket = this.getTiceket(rowOrSeatId, col)
    if (ticket)
      return getPurchaserIfAny(ticket)
    return null
  }

  selectedSectionSeat() {
    let filtered = this.seats?.filter(s => s.coord.sectX == this.selectedSection?.x && s.coord.sectY == this.selectedSection?.y)
    return filtered ? filtered : []
  }
  isSeatInSelectSection(seat: SeatAPIObject) {
    return seat && seat.coord.sectX == this.selectedSection?.x && seat.coord.sectY == this.selectedSection?.y
  }
  isMobile: boolean = false
  constructor(private router: Router, private activatedRoute: ActivatedRoute, private ngZone: NgZone, private responsive: BreakpointObserver) {
    responsive.observe([
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait,
    ]).subscribe(result => {
      if (result.matches) {
        this.isMobile = true
      }
    });

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
  tryInitialSectionSelection() {
    if (
      this.venue && this.venue.sections &&
      Array.isArray(this.venue.sections) &&
      this.venue.sections.length > 0 &&
      this.tickets &&
      this.selectedSection === undefined &&
      !this.trySelectSectionWithQuery() &&
      !this.trySelectSectionWithMostTicket()
    ) {
      this.selectedSection = this.venue.sections[0]
    }
  }
  trySelectSectionWithQuery(): boolean {
    let sectionParam = this.activatedRoute.snapshot.queryParamMap.get('section')
    let section = { x: Number(sectionParam?.split("-")[0]), y: Number(sectionParam?.split("-")[1]) }
    if (Number.isInteger(section.x) && Number.isInteger(section.y)) {
      let queriedSection = (this.venue?.sections as Array<any>).find(s => s.x == section.x && s.y == section.y)
      if (queriedSection) {
        this.selectedSection = queriedSection
        return true;
      }
    }
    return false
  }
  trySelectSectionWithMostTicket(): boolean {
    if (this.venue && this.venue.sections && Array.isArray(this.venue.sections) && this.tickets) {
      let sortedSection = this.venue.sections.slice()
      let isTicketAvaliableNFromSection = (section: { x: number, y: number }) => {
        return (ticket: TicketAPIObject) => {
          return !getPurchaserIfAny(ticket) && ticket.seat &&
            ticket.seat.coord.sectX == section.x &&
            ticket.seat.coord.sectY == section.y
        }
      }
      this.selectedSection =
        this.venue.sections.sort((sectionA, sectionB) =>
          (this.tickets ? this.tickets.filter(isTicketAvaliableNFromSection(sectionB)).length : 0) -
          (this.tickets ? this.tickets.filter(isTicketAvaliableNFromSection(sectionA)).length : 0)

        )[0]
      return true;
    }
    return false
  }
  @ViewChild('venueGalleryHref') venueGallery?: ElementRef;
  onGalleryload(event: Event) {
    let loadedImage: HTMLImageElement = (event.currentTarget as HTMLImageElement);
    if (this.venueGallery) {
      this.venueGallery.nativeElement.dataset.pswpWidth = loadedImage.width
      this.venueGallery.nativeElement.dataset.pswpHeight = loadedImage.width
    }
  }
  ngAfterContentChecked() {
    this.ngZone.runOutsideAngular(() => {
      const lightbox = new PhotoSwipeLightbox({
        gallery: '#venue-gallery a',
        pswpModule: PhotoSwipe,
        initialZoomLevel: 'fill',
      })
      lightbox.init()
    })

    if (this.venueGallery) {
      let loadedImage = this.venueGallery.nativeElement.children[0]
      console.log(loadedImage, this.venueGallery)
      this.venueGallery.nativeElement.dataset.pswpWidth = loadedImage.width * 1.1
      this.venueGallery.nativeElement.dataset.pswpHeight = loadedImage.height * 1.1
    }
  }
}
