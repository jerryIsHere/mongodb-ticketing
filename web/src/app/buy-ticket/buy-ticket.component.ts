import { Component, Input } from '@angular/core';
import { ApiService } from '../service/api.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { Event } from '../management-panel/management-panel.component';
import { MatMenuModule } from '@angular/material/menu';
import { Seat } from '../venue-seat/venue-seat.component';
import { MatButtonModule } from '@angular/material/button';
import { PriceTier } from '../management-panel/management-panel.component';
import { UserSessionService } from '../service/user-session.service';

@Component({
  selector: 'app-buy-ticket',
  standalone: true,
  imports: [MatGridListModule, MatMenuModule, MatButtonModule],
  templateUrl: './buy-ticket.component.html',
  styleUrl: './buy-ticket.component.sass'
})
export class BuyTicketComponent {
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
  constructor(private api: ApiService, public dialog: MatDialog, public userSession: UserSessionService ) {
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
  hasBuyer(seatId: string) {
    return this.getTiceket(seatId)?.occupied || this.getTiceket(seatId)?.occupant
  }
  buy(ticketId: string | undefined) {
    if (ticketId)
      this.api.request.patch(`/ticket/${ticketId}?buy`, {}).subscribe((value) => {
        if (this._id) this.loadData(this._id)
      })
  }
  getTiceket(seatId: string): Ticket | null {
    let search = this.tickets.filter(es => es.seatId == seatId)
    if (search.length > 0)
      return search[0]
    return null
  }
}
export interface Ticket {
  eventId: string,
  seatId: string,
  priceTierId: string,
  priceTier?: PriceTier,
  occupied?: boolean
  occupant?: any
  _id: string
}
