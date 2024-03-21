import { Component, Input } from '@angular/core';
import { ApiService } from '../service/api.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { Event } from '../management-panel/management-panel.component';
import { MatMenuModule } from '@angular/material/menu';
import { Seat } from '../venue-seat/venue-seat.component';

@Component({
  selector: 'app-eventseat',
  standalone: true,
  imports: [MatGridListModule, MatMenuModule],
  templateUrl: './eventseat.component.html',
  styleUrl: './eventseat.component.sass'
})
export class EventseatComponent {
  cols: string[] = []
  rows: string[] = []
  slots: (Seat | undefined)[] = []
  seats: Seat[] | undefined
  eventSeats: (EventSeat)[] = []
  _id: string | undefined
  _event: Event | undefined
  @Input()
  set event(event: Event) {
    this._event = event
    if (this._event && this._event._id) this.loadData(this._event._id)
  }
  constructor(private api: ApiService, public dialog: MatDialog) {

  }
  loadData(id: string) {
    this.api.httpClient.get(`/seat?venueId=${this._event?.venueId}`).toPromise().then((result: any) => {
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
    this.api.httpClient.get(`/ticket?eventId=${this._event?._id}`).toPromise().then((result: any) => {
      if (result && result.data) {
        this.eventSeats = result.data
      }
    })
  }
}

export interface EventSeat {
  eventId: string,
  seatId: string,
  priceTierId: string,
  occupantId: string
}