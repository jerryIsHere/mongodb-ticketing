import { Component, Input, ViewChild } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { ShowAPIObject, VenueAPIObject, TicketAPIObject, SeatAPIObject, IPriceTier, isShowSelling, getSellingInfo, getPurchaserIfAny } from '../../api-util';
import { SeatFormComponent } from '../../forms/seat-form/seat-form.component';
import { SeatingPlanComponent } from '../../seatUI/seating-plan/seating-plan.component';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'
import { UserSessionService } from '../../service/user-session.service';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';

import { TicketSelectedComponent } from '../../snackbar/ticket-selected/ticket-selected.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-buy-ticket',
  standalone: true,
  imports: [MatGridListModule, MatButtonModule, SeatingPlanComponent, DatePipe, MatIconModule, MatProgressSpinnerModule, MatBottomSheetModule],
  templateUrl: './buy-ticket.component.html',
  styleUrl: './buy-ticket.component.sass'
})
export class BuyTicketComponent {
  seats: SeatAPIObject[] | undefined
  tickets: TicketAPIObject[] = []
  _id: string | undefined
  event: ShowAPIObject | undefined
  venue: VenueAPIObject | undefined
  @ViewChild('seatingPlan') seatingPlan?: SeatingPlanComponent;
  @Input()
  set id(id: string) {
    this._id = id
    if (id && this.userSession.user) this.loadData(id)
  }

  constructor(private api: ApiService, public dialog: MatDialog, public userSession: UserSessionService,
    private _bottomSheet: MatBottomSheet) {

  }
  loadData(id: string) {
    var promises: Promise<any>[] = []
    this.api.request.get(`/event/${this._id}`).toPromise().then((result: any) => {
      if (result && result.data) {
        this.event = result.data
        if (this.event && this.event.shoppingCartSize) {
          let quota = getSellingInfo(this.event)?.ticketQuota
          this.shoppingCartSize = quota != undefined && quota > 0 && Number(this.event.shoppingCartSize) > Number(quota) ? quota : this.event.shoppingCartSize
        }
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
  actionBtmSheetRef?: MatBottomSheetRef<TicketSelectedComponent>
  sectionSelectedSeatIds: Set<string> = new Set<string>()
  shoppingCartSize?: number
  checkAction() {
    let tickets: TicketAPIObject[] = [];
    // combine tickets from seat selected in section with button + seat selected outside section with text command
    [...this.seatingPlan && this.seatingPlan.selectedSeatIds ? Array.from(this.seatingPlan.selectedSeatIds.values()) : [],
    ...this.otherSelectedSeatIds.map(seat => seat._id)
    ].map(sid => this.tickets.find(t => t.seat?._id.toString() == sid)).filter(ticket => ticket != undefined).forEach(t => {
      if (t && !getPurchaserIfAny(t))
        tickets.push(t)
    })
    console.log(tickets)
    let seatInfo = this.otherSelectedSeatIds.
      map(seat => { return { seat: seat, ticket: this.tickets.find(t => t.seat?._id.toString() == seat._id) } }).
      map(seatNticket => { return { ...seatNticket, ...{ priceTier: seatNticket.ticket?.priceTier } } }).
      map(info => info.seat.row + info.seat.no + (info.priceTier && info.priceTier?.tierName ? `(${info.priceTier?.tierName})` : ""))
    let action = {
      tickets: tickets,
      limit: this.shoppingCartSize,
      seatInfo: seatInfo,
      success: false,
      reload: false,
    }
    if (this.actionBtmSheetRef == undefined && tickets.length >0 && this.seatingPlan) {
      this.actionBtmSheetRef = this._bottomSheet.open(TicketSelectedComponent, {
        data: action,
        hasBackdrop: false,
      });
      this.actionBtmSheetRef.afterDismissed().subscribe((response) => {
        this.actionBtmSheetRef = undefined
        if (this._id) {
          // commenting this because this exhause server resources
          if (!action.success) this.loadData(this._id);
        }
        this.seatingPlan?.clearSelectedSeat()
      });
    }
    else if (this.actionBtmSheetRef && this.seatingPlan) {
      if (tickets.length == 0) {
        this.actionBtmSheetRef.dismiss()
      }
      else {
        this.actionBtmSheetRef.instance.data.tickets = tickets
        this.actionBtmSheetRef.instance.data.seatInfo = seatInfo
      }
    }
  }
  // for selectedSeat outside current section
  otherSelectedSeatIds: SeatAPIObject[] = []
  openForm(checkSection: Boolean = true) {
    if (this._id && this.seatingPlan?.selectedSection) {
      const dialogRef = this.dialog.open(SeatFormComponent, {
        data: { _id: this._id },
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe((rowsNcols: { row: string, no: string }[]) => {
        let allSellingSeat: any[] = rowsNcols.
          map((rc) => this.seats?.find(s => s.row == rc.row && s.no == Number(rc.no))).
          filter((seat) => seat != null && this.seatingPlan && this.seatingPlan.getTiceket(seat._id) != null
            && this.seatingPlan.getBuyer(seat._id) == null)
        let seatInside: any[] = allSellingSeat.filter(s => s.coord.sectX == this.seatingPlan?.selectedSection?.x && s.coord.sectY == this.seatingPlan?.selectedSection?.y)
        if (!checkSection) {
          this.otherSelectedSeatIds = allSellingSeat.filter(s => !(s.coord.sectX == this.seatingPlan?.selectedSection?.x && s.coord.sectY == this.seatingPlan?.selectedSection?.y))
        }
        else {
          this.otherSelectedSeatIds = [];
        }
        this.sectionSelectedSeatIds = new Set<string>(seatInside.map(seat => seat._id))
        this.checkAction()
      })
    }
  }
  clearAction() {
    this.seatingPlan?.clearSelectedSeat();
    this.otherSelectedSeatIds = [];
  }
  isShowSelling(show: ShowAPIObject) {
    return isShowSelling(show)
  }

}


