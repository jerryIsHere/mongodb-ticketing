import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { MatDialog } from '@angular/material/dialog';
import { SeatFormComponent } from '../../forms/seat-form/seat-form.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SeatingPlanComponent } from '../../seatUI/seating-plan/seating-plan.component';
import { Seat } from '../../interface';
@Component({
  selector: 'app-venue-seat',
  standalone: true,
  imports: [SeatingPlanComponent, MatMenuModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
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

  _seatingPlan?: SeatingPlanComponent
  get seatingPlan(): SeatingPlanComponent | undefined { return this._seatingPlan }
  @ViewChild('seatingPlan') set seatingPlan(content: SeatingPlanComponent) {
    if (content) {
      this._seatingPlan = content;
      console.log("_seatingPlan", this._seatingPlan, this.seatingPlan)
      if (this.seatingPlan && this.seatingPlan.selectedSection) {
        console.log("seatingPlan")
        let selectedSection = this.seatingPlan.selectedSection
        selectedSection = (this.venue.sections as Array<any>).find(s => s.x == selectedSection.x && s.y == selectedSection.y)
        if (selectedSection && selectedSection.options) {
          this.optionForm.controls["horizontalOrder"].setValue(selectedSection.options.horizontalOrder)
          this.optionForm.controls["verticleOrder"].setValue(selectedSection.options.verticleOrder)
        }
      }
    }
  }
  @Input()
  set id(_id: string) {
    this._id = _id
    this.loadData(this._id)
  }

  optionForm: FormGroup = this._formBuilder.group({
    horizontalOrder: new FormControl("", [Validators.required]),
    verticleOrder: new FormControl("", [Validators.required]),
  });
  constructor(private api: ApiService, public dialog: MatDialog, private _formBuilder: FormBuilder) {

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
        data: { _id: this._id },
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe((rowsNcols: { row: string, no: string }[]) => {
        console.log(this.seatingPlan?.selectedSection)
        if (this._id)
          this.api.request.post(`/seat?venueId=${this._id}&batch`, {
            seats:
              rowsNcols.map(rw => { return { row: rw.row, no: rw.no, coord: { orderInRow: Number(rw.no), sectX: this.seatingPlan?.selectedSection?.x, sectY: this.seatingPlan?.selectedSection?.y } } })
          }).toPromise().then((result: any) => {
            if (result && result.success && this._id) {
              this.seatingPlan?.clearSelectedSeat()
              this.loadData(this._id)
            }
          })
      })
    }
  }
  openDeletationForm() {
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
        if (this._id)
          this.api.request.delete(`/seat?batch`, {
            body: {
              seatIds: seatIds
            }
          },).toPromise().then((result: any) => {
            if (result && result.success && this._id) {
              this.loadData(this._id)
              this.seatingPlan?.clearSelectedSeat()
            }
          })
      })
    }
  }
  onSelectedSectionChange(value: { x: number, y: number }) {
    let section = (this.venue.sections as Array<any>).find(s => s.x == value.x && s.y == value.y)
    if (section && section.options) {
      this.optionForm.controls["order"].setValue(section.options.order)
    }
    else {
      this.optionForm.controls["order"].setValue("LTR")
    }
  }
  submitSectionOption() {
    console.log(this.optionForm.valid, this._id, this.seatingPlan, this.seatingPlan?.selectedSection)
    if (this.optionForm.valid && this._id && this.seatingPlan && this.seatingPlan.selectedSection) {
      let selectedSection = this.seatingPlan.selectedSection
      selectedSection = (this.venue.sections as Array<any>).find(s => s.x == selectedSection.x && s.y == selectedSection.y)
      if (selectedSection) {
        selectedSection.options = this.optionForm.getRawValue()
        let venueId = this._id
        this.api.request.patch(`/venue/${venueId}`, this.venue).toPromise().then((result: any) => {
          if (result && result.success) {
            this.loadData(venueId)
          }
        })
      }
    }
  }
}