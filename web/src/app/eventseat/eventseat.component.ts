import { Component, Input } from '@angular/core';
import { ApiService } from '../service/api.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { Event } from '../management-panel/management-panel.component';
import { MatMenuModule } from '@angular/material/menu';
import { Seat } from '../venue-seat/venue-seat.component';
import { MatButtonModule } from '@angular/material/button';
import { PriceTier } from '../management-panel/management-panel.component';

@Component({
  selector: 'app-eventseat',
  standalone: true,
  imports: [MatGridListModule, MatMenuModule, MatButtonModule],
  templateUrl: './eventseat.component.html',
  styleUrl: './eventseat.component.sass'
})
export class EventseatComponent {
  cols: string[] = []
  rows: string[] = []
  slots: (Seat | undefined)[] = []
  seats: Seat[] | undefined
  tickets: Ticket[] = []
  _id: string | undefined
  event: Event | undefined
  priceTiers: PriceTier[] | undefined
  @Input()
  set id(id: string) {
    this._id = id
    if (id) this.loadData(id)
  }
  constructor(private api: ApiService, public dialog: MatDialog) {
    this.api.request.get("/priceTier?list").toPromise().then((result: any) => {
      if (result && result.data)
        this.priceTiers = result.data
    })
  }
  loadData(id: string) {
    var promises: Promise<any>[] = []
    this.api.request.get(`/event/${this._id}`).toPromise().then((result: any) => {
      if (result && result.data) {
        this.event = result.data
        return result.data
      }
    }).then((event) => {
      if (event) {
        this.api.request.get(`/seat?venueId=${event.venueId}`).toPromise().then((result: any) => {
          if (result && result.data) {
            this.seats = result.data
            if (this.seats) {
              this.rows = Array.from((result.data as Array<Seat>).map((seat) => seat.row).reduce((rows, r, i) => rows.add(r), new Set<string>())).sort()
              this.cols = Array.from((result.data as Array<Seat>).map((seat: Seat) => seat.no).reduce((rows, r, i) => rows.add(r), new Set<string>())).sort()
              this.slots = []
              for (let row of this.rows) {
                for (let col of this.cols) {
                  this.slots.push(this.seats.find(seat => seat.no == col && seat.row == row))
                }
              }
            }
          }
        })
      }
    })
    this.api.request.get(`/ticket?eventId=${this._id}`).toPromise().then((result: any) => {
      if (result && result.data) {
        this.tickets = result.data
      }
    })
  }
  getBuyer(seatId: string) {
    this.getTiceket(seatId)?.occupant 
    return this.getTiceket(seatId)?.occupant 
  }
  delete(ticketId: string | undefined) {
    if (ticketId)
      this.api.request.delete(`/ticket/${ticketId}`).subscribe((value) => {
        if (this._id) this.loadData(this._id)
      })

  }
  getTiceket(seatId: string): Ticket | null {
    let search = this.tickets.filter(es => es.seatId == seatId)
    if (search.length > 0)
      return search[0]
    return null
  }
  startSell(seatId: string, priceTierId: string) {
    if (this._id)
      this.api.request.post(`/ticket?create`, { seatId: seatId, eventId: this._id, priceTierId: priceTierId }).subscribe((value) => {
        if (this._id) this.loadData(this._id)
      })

  }
}

export interface Ticket {
  eventId: string,
  seatId: string,
  priceTierId: string,
  occupantId: string
  priceTier?: PriceTier,
  occupant?: any
  _id: string
}