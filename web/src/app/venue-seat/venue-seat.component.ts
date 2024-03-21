import { Component, Input } from '@angular/core';
import { ApiService } from '../service/api.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { SeatFormComponent } from '../forms/seat-form/seat-form.component';
import { MatMenuModule } from '@angular/material/menu';
@Component({
  selector: 'app-venue-seat',
  standalone: true,
  imports: [MatGridListModule, MatMenuModule],
  templateUrl: './venue-seat.component.html',
  styleUrl: './venue-seat.component.sass'
})
export class VenueSeatComponent {
  cols: string[] = []
  rows: string[] = []
  slots: (Seat | undefined)[] = []
  seats: Seat[] | undefined
  _id: string | undefined
  @Input()
  set id(_id: string) {
    this._id = _id
    this.loadData(this._id)
  }
  constructor(private api: ApiService, public dialog: MatDialog) {

  }
  loadData(id: string) {
    this.api.httpClient.get(`/seat?venueId=${this._id}`).toPromise().then((result: any) => {
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

  openForm() {
    if (this._id) {
      const dialogRef = this.dialog.open(SeatFormComponent, {
        data: { _id: this._id }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (this._id) this.loadData(this._id)
      })
    }
  }
  delete(_id: string) {
    return this.api.httpClient.delete(`/seat/${_id}`).subscribe((value) => {
      if (this._id) this.loadData(this._id)
    })
  }
}

export interface Seat {
  row: string
  no: string
  venueId: string
  _id: string
}