import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../service/api.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

const charCodeOfA = "A".charCodeAt(0)
const charCodeOfZ = "Z".charCodeAt(0)

@Component({
  selector: 'app-seat-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './seat-form.component.html',
  styleUrl: './seat-form.component.sass'
})
export class SeatFormComponent {
  queryForm: FormGroup = this._formBuilder.group({
    query: new FormControl('', [Validators.required]),
  })
  /*
  a1-a12,b1-b15,c1-c17,d1-d16,e1-e13,f1-f8,g1-g9,h1-h8,i1-i6,j1-j3
  a18-a35,b18-b36,c18-c37,e18-e39,f18-f40,g18-g41,h18-h42,i18-i43,j18-j43,k18-k45,l18-l40,m18-m33
  a46-a57,b46-b60,c46-c62,d46-d61,e46-e58,f46-f53,g46-g54,h46-h58,i46-i51,j46-j48
  aa1-aa12,bb1-bb13
  cc14-cc26,dd14-dd23,ee14-dd23,ff14-ff25
  cc27-cc36,dd27-dd37,ee27-ee38,ff27-ff35,gg27-gg35,hh27-hh38
  cc39-cc53,dd39-dd54,ee39-ee56,ff39-ff56,gg39-gg56,hh39-hh56,ii39-ii58,jj39-jj59,kk39-kk59,ll39-ll52,mm39-mm55
  cc60-cc59,dd60-dd70,ee60-ee71,ff60-ff71,gg60-gg72,hh60-hh73,ii60-ii74,jj60-jj75,kk60-kk59,ll60-ll58,mm60-74
  cc76-cc88,dd76-dd88,ee76-ee86,ff76-ff86,gg76-gg88,hh76-hh84
  aa89-aa100,bb89-bb101,cc89-cc90
  */
  constructor(
    public dialogRef: MatDialogRef<SeatFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { _id: string },
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) { }
  submit() {
    if (this.queryForm.valid) {
      var seats: { row: string, no: number }[] = []
      var commands: string[] = (this.queryForm.controls["query"].value as string).toUpperCase().replaceAll(" ", "").replaceAll("\t", "").split(/[,\n]/)
      commands.forEach((command) => {
        let start = command.split(/[:-]/)[0]
        let end = command.split(/[:-]/)[1]
        let startRow = start.match(/[A-Z]+/)
        let startNo = start.match(/[\d]+/)
        let endRow = end ? end.match(/[A-Z]+/) : startRow
        let endNo = end ? end.match(/[\d]+/) : startNo

        if (startRow && startNo && endRow && endNo && Number.isInteger(Number(startNo[0])) && Number.isInteger(Number(endNo[0]))) {
          let rows: string[] = [startRow[0]]
          let cols: number[] = []
          for (var i = Number(startNo[0]); i <= Number(endNo[0]); i++) cols.push(i);
          var r: string = startRow[0]

          while ((r.length == endRow[0].length && r.localeCompare(endRow[0]) < 0) || (r.length < endRow[0].length)) {
            var tailZMatch = r.match(/[z]+$/)
            var tailZLength = tailZMatch && tailZMatch["index"] != null ? r.length - tailZMatch["index"] : 0
            var carryPosition = r.length - 1 - tailZLength
            r = tailZLength < r.length ? (r.substring(0, carryPosition) +
              String.fromCharCode(r.charCodeAt(carryPosition) + 1) +
              "A".repeat(tailZLength)) : "Z".repeat(r.length + 1)
            rows.push(r)
          }
          for (let row of rows) {
            for (let col of cols) {
              seats.push({ row: row, no: col })
            }
          }

        }

      })
      this.dialogRef.close(seats)
    }
  }
  close() {
    this.dialogRef.close();
  }
}
