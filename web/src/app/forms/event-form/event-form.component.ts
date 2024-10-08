import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../service/api.service';
import { IPriceTier, ISaleInfo, ShowAPIObject, VenueAPIObject } from '../../api-util';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

var tolocaltimezone = (d: Date) => {
  d.setTime(d.getTime() - d.getTimezoneOffset() * 60000)
  return d
}

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatChipsModule, MatInputModule, FormsModule, ReactiveFormsModule, MatSelectModule, MatIconModule, MatDialogModule],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.sass'
})
export class EventFormComponent {
  shoppingCartSizeLimit = 10;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  eventForm = this._formBuilder.group({
    eventname: new FormControl(this.data.event.eventname, [Validators.required]),
    datetime: new FormControl(this.data.event.datetime ? tolocaltimezone(new Date(this.data.event.datetime)).toISOString().split('Z')[0] : '', [Validators.required,]),
    saleInfos: new FormArray(
      this.data.event?.saleInfos ? this.data.event?.saleInfos.map(info => this.infoFormBuilder(info)) :
        [0, 1].map(i => this.infoFormBuilder())
    ),
    priceTiers: new FormArray(
      this.data.event?.priceTiers ? this.data.event.priceTiers.map(priceTier =>
        this._formBuilder.group(
          {
            tierName: new FormControl(priceTier.tierName, [Validators.required]),
            price: new FormControl(priceTier.price, [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$"),]),
          })) : []
    ),
    duration: new FormControl(this.data.event.duration, [Validators.required, Validators.min(0), Validators.pattern("^[-0-9]*$"),]),
    shoppingCartCooldown: new FormControl(this.data.event.shoppingCartCooldown, [Validators.required, Validators.min(0), Validators.pattern("^[-0-9]*$"),]),
    shoppingCartSize: new FormControl(this.data.event.shoppingCartSize, [Validators.max(this.shoppingCartSizeLimit), Validators.required, Validators.pattern("^[-0-9]*$"),]),
    venueId: new FormControl(this.data.event.venueId, [Validators.required,]),
  });
  constructor(
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event: ShowAPIObject, venues: VenueAPIObject[] },
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) {
  }
  infoFormBuilder(saleInfo: ISaleInfo | undefined = undefined) {
    let formValue = {
      start: saleInfo ? tolocaltimezone(new Date(saleInfo.start)).toISOString().split('Z')[0] : '',
      end: saleInfo ? tolocaltimezone(new Date(saleInfo.end)).toISOString().split('Z')[0] : '',
      buyX: saleInfo?.buyX,
      yFree: saleInfo?.yFree == Number.MAX_VALUE ? "*" : saleInfo?.yFree,
      ticketQuota: saleInfo?.ticketQuota
    }
    return this._formBuilder.group(
      {
        start: new FormControl(formValue.start, [Validators.required,]),
        end: new FormControl(formValue.end, [Validators.required,]),
        ticketQuota: new FormControl(formValue.ticketQuota, [Validators.required, Validators.min(-1), Validators.pattern("^[-]?[0-9]*$"),]),
        buyX: new FormControl(formValue.buyX, [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$"),]),
        yFree: new FormControl(formValue.yFree, [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$|^[*]{1,1}$"),]),
      })
  }
  submit() {
    if (this.eventForm.valid) {
      let timezone = (new Date()).getTimezoneOffset() * 60000
      let formData = this.eventForm.getRawValue()
      console.log(formData)
      let body = {
        ...formData,
        ...{
          datetime: new Date(formData.datetime ? formData.datetime : ''),
          saleInfos: formData.saleInfos.map(info => {
            return {
              ...info,
              ...{
                start: info.start ? new Date(info.start) : '',
                end: info.end ? new Date(info.end) : '',
                yFree: info.yFree as any == "*" ? Number.MAX_VALUE : info.yFree
              }
            }
          }),
          priceTiers: this.data.event.priceTiers
        },
      }
      console.log(body)
      if (this.data && this.data.event && this.data.event._id) {
        this.api.request.patch(`/event/${this.data.event._id}`, body).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(body)
          }
        })
      }
      else {
        this.api.request.post("/event?create", body).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(body)
          }
        })
      }
    }
  }
  addPriceTier(event: MatChipInputEvent) {
    const value = (event.value || '').trim().split(':');
    let tierName = value[0].trim()
    let price = Number(value[1].replaceAll('$', '').trim())
    if (!Array.isArray(this.data.event.priceTiers)) this.data.event.priceTiers = []
    if (value && Number.isInteger(price) &&
      this.data.event.priceTiers &&
      this.data.event.priceTiers.filter(p => p.tierName == tierName).length == 0) {

      this.data.event.priceTiers.push({ tierName: tierName, price: price });
    }
    // Clear the input value
    event.chipInput!.clear();
  }
  removePriceTier(priceTier: IPriceTier): void {
    if (this.data.event.priceTiers) {
      const index = this.data.event.priceTiers.findIndex(p => p.tierName == priceTier.tierName);

      if (index >= 0) {
        this.data.event.priceTiers.splice(index, 1);
      }
    }
  }
  close() {
    this.dialogRef.close();
  }
}
