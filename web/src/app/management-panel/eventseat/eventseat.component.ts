import { Component, Input, ViewChild } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { Show, Venue, Ticket, Seat, PriceTier } from '../../interface';
import { SeatFormComponent } from '../../forms/seat-form/seat-form.component';
import { SeatingPlanComponent } from '../../seatUI/seating-plan/seating-plan.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon'
import { SeatSelectedComponent } from '../../snackbar/seat-selected/seat-selected.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-eventseat',
  standalone: true,
  imports: [MatGridListModule, MatButtonModule, SeatingPlanComponent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './eventseat.component.html',
  styleUrl: './eventseat.component.sass'
})
export class EventseatComponent {

  seats: Seat[] | undefined
  tickets: Ticket[] = []
  _id: string | undefined
  event: Show | undefined
  venue: Venue | undefined
  @ViewChild('seatingPlan') seatingPlan?: SeatingPlanComponent;
  priceTiers: PriceTier[] | undefined
  @Input()
  set id(id: string) {
    this._id = id
    if (id) this.loadData(id)
  }
  constructor(private api: ApiService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
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
          }
        })
        this.api.request.get(`/venue/${event.venueId}`).toPromise().then((result: any) => {
          if (result && result.data) {
            this.venue = result.data
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
  // getBuyer(seatId: string) {
  //   this.getTiceket(seatId)?.occupant
  //   return this.getTiceket(seatId)?.occupant
  // }
  // delete(ticketId: string | undefined) {
  //   if (ticketId)
  //     this.api.request.delete(`/ticket/${ticketId}`).subscribe((value) => {
  //       if (this._id) this.loadData(this._id)
  //     })

  // }
  // getTiceket(seatId: string): Ticket | null {
  //   let search = this.tickets.filter(es => es.seatId == seatId)
  //   if (search.length > 0)
  //     return search[0]
  //   return null
  // }
  // startSell(seatId: string, priceTierId: string) {
  //   if (this._id)
  //     this.api.request.post(`/ticket?create`, { seatId: seatId, eventId: this._id, priceTierId: priceTierId }).subscribe((value) => {
  //       if (this._id) this.loadData(this._id)
  //     })

  // }
  actionSnackbarRef?: MatSnackBarRef<SeatSelectedComponent>
  selectedSeatIds: Set<string> = new Set<string>()

  checkAction($event: Set<string>) {
    if (this.actionSnackbarRef == undefined && this.seatingPlan) {
      this.actionSnackbarRef = this._snackBar.openFromComponent(SeatSelectedComponent, {
        data: {
          eventId: this._id,
          seats: this.seats,
          tickets: this.tickets,
          selectedSeatIds: Array.from($event.values()),
          priceTiers: this.priceTiers,
          priceTiersColors: this.seatingPlan?.priceTiersColors
        }
      });
      this.actionSnackbarRef.afterDismissed().subscribe(() => {
        this.actionSnackbarRef = undefined
        if (this._id)
          this.loadData(this._id);
        this.seatingPlan?.clearSelectedSeat()
      });
    }
    else if (this.actionSnackbarRef && this.seatingPlan) {
      this.actionSnackbarRef.instance.data.selectedSeatIds = Array.from(this.selectedSeatIds.values())
    }
  }
  openForm() {
    if (this._id && this.seatingPlan?.selectedSection) {
      const dialogRef = this.dialog.open(SeatFormComponent, {
        data: { _id: this._id },
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe((rowsNcols: { row: string, no: string }[]) => {
        let seatIds: string[] = []
        rowsNcols.forEach((rc) => {
          let seat = this.seats?.filter(s => s.row == rc.row && s.no == Number(rc.no) &&
            s.coord.sectX == this.seatingPlan?.selectedSection?.x && s.coord.sectY == this.seatingPlan?.selectedSection?.y)
          if (seat && seat.length > 0) {
            seatIds.push(seat[0]._id)
          }
        })
        if (this.seatingPlan) {
          this.selectedSeatIds = new Set<string>(seatIds)
        }
      })
    }
  }
}
