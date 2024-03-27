import { Component, Input, ViewChild } from '@angular/core';
import { ApiService } from '../service/api.service';
import { MatDialog } from '@angular/material/dialog';
import { SeatFormComponent } from '../forms/seat-form/seat-form.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { SeatingPlanComponent } from '../seatUI/seating-plan/seating-plan.component';
import { Seat } from '../seatUI/seating-plan/seating-plan.component';

@Component({
  selector: 'app-venue-seat',
  standalone: true,
  imports: [SeatingPlanComponent, MatMenuModule, MatButtonModule,],
  templateUrl: './venue-seat.component.html',
  styleUrl: './venue-seat.component.sass'
})
export class VenueSeatComponent {
  cols: string[] = []
  rows: string[] = []
  slots: (Seat | undefined)[] = []
  seats: Seat[] | undefined
  _id: string | undefined
  venue: any | undefined
  @ViewChild('seatingPlan') seatingPlan?: SeatingPlanComponent;
  @Input()
  set id(_id: string) {
    this._id = _id
    this.loadData(this._id)
  }
  constructor(private api: ApiService, public dialog: MatDialog) {

  }
  loadData(id: string) {
    this.api.request.get(`/seat?venueId=${this._id}`).toPromise().then((result: any) => {
      if (result && result.data) {
        this.seats = result.data
        this.seatingPlan?.render()
      }
    })
    this.api.request.get(`/venue/${this._id}`).toPromise().then((result: any) => {
      if (result && result.data) {
        this.venue = result.data
      }
    })
  }
  openCreationForm() {
    if (this._id && this.seatingPlan?.selectedSection) {
      const dialogRef = this.dialog.open(SeatFormComponent, {
        data: { _id: this._id }
      });
      dialogRef.afterClosed().subscribe((rowsNcols: { row: string, no: string }[]) => {
        console.log(this.seatingPlan?.selectedSection)
        if (this._id)
          this.api.request.post(`/seat?venueId=${this._id}&batch`, {
            seats:
              rowsNcols.map(rw => { return { row: rw.row, no: rw.no, coord: { orderInRow: Number(rw.no), sectX: this.seatingPlan?.selectedSection?.x, sectY: this.seatingPlan?.selectedSection?.y } } })
          }).toPromise().then((result: any) => {
            if (result && result.success && this._id) {
              this.loadData(this._id)
            }
          })
      })
    }
  }
  openDeletationForm() {
    if (this._id && this.seatingPlan?.selectedSection) {
      const dialogRef = this.dialog.open(SeatFormComponent, {
        data: { _id: this._id }
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
        if (this._id)
          this.api.request.delete(`/seat?batch`, {
            body: {
              seatIds: seatIds
            }
          },).toPromise().then((result: any) => {
            if (result && result.success && this._id) {
              this.loadData(this._id)
            }
          })
      })
    }
  }
  delete(_id: string) {
    return this.api.request.delete(`/seat/${_id}`).subscribe((value) => {
      if (this._id) this.loadData(this._id)
    })
  }
}