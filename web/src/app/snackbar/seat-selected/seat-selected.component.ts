import { Component, Inject } from '@angular/core';
import { PriceTier } from '../../management-panel/management-panel.component';
import { Seat } from '../../seatUI/seating-plan/seating-plan.component';
import { Ticket } from '../../seatUI/seating-plan/seating-plan.component'
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-seat-selected',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './seat-selected.component.html',
  styleUrl: './seat-selected.component.sass'
})
export class SeatSelectedComponent {
  constructor(
    public snackRef: MatSnackBarRef<SeatSelectedComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: {
      seats: Seat[] | undefined,
      tickets: Ticket[],
      selectedSeatIds: string[],
      priceTiers: PriceTier[] | undefined,
      priceTiersColors?: Map<string, string>,
      eventId?: string | undefined
    }, private api: ApiService,) {

  }
  sellAt(priceTier: PriceTier) {
    if (this.data.seats && this.data.eventId) {
      console.log(this.data.selectedSeatIds, this.data.tickets)
      let existing: string[] = this.data.selectedSeatIds.filter(seatId => this.data.tickets.filter(t => t.seatId == seatId).length > 0)
        .map(seatId => this.data.tickets.filter(t => t.seatId == seatId)[0]._id)
      let missing: string[] = this.data.selectedSeatIds.filter(seatId => this.data.tickets.filter(t => t.seatId == seatId).length == 0)


      console.log(missing.map(seatId => {
        return { seatId: seatId, eventId: this.data.eventId, priceTierId: priceTier._id }
      }))
      let promise = []
      if (missing.length > 0) {
        promise.push(this.api.request.post(`/ticket?batch&create`, {
          tickets: missing.map(seatId => {
            return { seatId: seatId, eventId: this.data.eventId, priceTierId: priceTier._id }
          })
        },).toPromise().then((result: any) => {
          if (result && result.success) {
          }
        }))
      }
      if (existing.length > 0) {
        promise.push(this.api.request.patch(`/ticket?batch&priceTier=${priceTier._id}`, {
          ticketIds: existing
        },).toPromise().then((result: any) => {
          if (result && result.success) {
          }
        }))

      }
      Promise.all(promise).then(_ => {
        this.snackRef.dismiss();
      })
      this.doing = true
    }
  }
  doing: boolean = false;
  removeTickets() {
    if (this.data.seats && this.data.eventId) {
      let existing: string[] = this.data.selectedSeatIds.filter(seatId => this.data.tickets.filter(t => t.seatId == seatId).length > 0)
        .map(seatId => this.data.tickets.filter(t => t.seatId == seatId)[0]._id)
      if (existing.length > 0) {
        this.api.request.delete(`/ticket?batch`, {
          body: {
            ticketIds: existing
          }
        },).toPromise().then((result: any) => {
          if (result && result.success) {
            this.snackRef.dismiss();
          }
        })
        this.doing = true
      }
    }
  }


}
