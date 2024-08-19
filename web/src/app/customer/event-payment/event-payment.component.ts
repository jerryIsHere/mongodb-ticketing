import { Component, ViewChild, Input, Output, EventEmitter, } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { DatetimeOffsetPipe } from '../../pipes/datetime-offset.pipe';
import { DatetimeTimezonePipe } from '../../pipes/datetime-timezone.pipe';
import { ClientTicketAPIObject, ShowAPIObject, ticketCompareByDate, ticketConfirmDateString, ticketPurchaseDateString } from '../../interface-util'
import { ApiService } from '../../service/api.service';
import { TicketFormComponent } from '../../forms/ticket-form/ticket-form.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import dateFormat, { masks } from "dateformat";
import { PaymentMessageComponent } from '../payment-message/payment-message.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { count } from 'console';

@Component({
  selector: 'app-event-payment',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe, DatePipe, DatetimeOffsetPipe, DatetimeTimezonePipe,
    PaymentMessageComponent],
  templateUrl: './event-payment.component.html',
  styleUrl: './event-payment.component.sass'
})
export class EventPaymentComponent {
  loaded = false
  ticketDataSource: MatTableDataSource<ClientTicketAPIObject> = new MatTableDataSource<ClientTicketAPIObject>()
  ticketDataColumn = ['event.eventname', 'seat', 'priceTier.tierName', 'priceTier.price', 'purchaseDate', 'confirmedBy'];
  shows: ShowAPIObject[] = [];
  tickets: ClientTicketAPIObject[] = []
  showFromQuery?: string
  selectedShow?: ShowAPIObject
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  showSearch = new FormControl<string | ShowAPIObject>('');
  @Input()
  set eventId(eventId: string) {
    this.showFromQuery = eventId
    this.showSelected(eventId)
  }
  filteredShows: Observable<ShowAPIObject[]> = new Observable<ShowAPIObject[]>();
  constructor(public dialog: MatDialog, private api: ApiService) {
    this.loadData()
  }

  displayFn(event: ShowAPIObject): string {
    return event && event.eventname ? event.eventname : '';
  }
  private _filter(keywords: string): ShowAPIObject[] {
    const filterValue = keywords.toLowerCase();
    if (this.shows) {
      return this.shows.filter(event =>
        event.eventname?.toLowerCase().includes(filterValue) ||
        event._id?.toLowerCase()?.includes(filterValue)
      );
    }
    else {
      return []
    }
  }
  ngAfterViewInit() {
    if (this.paginator && this.sort && this.ticketDataSource) {
      this.ticketDataSource.paginator = this.paginator;
      this.ticketDataSource.sort = this.sort;
      let valueAccessor = (data: any, keys: string) => {
        let cursor: any = data;
        if (keys == 'seat') {
          return data.seat.row + data.seat.no
        } else {
          for (let key of keys.split(".")) {
            if (cursor[key]) {
              cursor = cursor[key]
            }
            else {
              break;
            }
          }
          return cursor
        }
      }
      this.ticketDataSource.filterPredicate = (data: any, filter: string) => {
        const accumulator = (valueString: string, keys: string) => {
          let value: any = valueAccessor(data, keys)
          if (typeof value === "string") {
            valueString += value
          }
          return valueString;
        };
        const dataStr = ['occupant.email', 'occupant.eventname', ...this.ticketDataColumn].reduce(accumulator, '').toLowerCase();
        // Transform the filter by converting it to lowercase and removing whitespace.
        const transformedFilter = filter.split("+").map(f => f.trim().toLowerCase());
        return transformedFilter.filter(f => dataStr.indexOf(f) !== -1).length == transformedFilter.length;
      };
      this.ticketDataSource.sortingDataAccessor = valueAccessor
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.ticketDataSource) {
      this.ticketDataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  openForm(data: ClientTicketAPIObject) {
    const dialogRef = this.dialog.open(TicketFormComponent, {
      data: JSON.parse(JSON.stringify(data)),
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      let ticket = result as ClientTicketAPIObject
      if (ticket) {
        if (result.voided) {
          this.tickets = this.tickets.filter(t => t._id != ticket._id)
        }
        else {
          let ticketInd = this.tickets.findIndex(t => t._id == ticket._id)
          if (ticketInd > -1) this.tickets[ticketInd] = ticket
        }
        this.ticketDataSource.data = this.tickets.slice()
      }
    })
  }
  loadData() {
    return this.api.request.get("/ticket?my").toPromise().then((result: any) => {
      if (result && result.data) {
        this.loaded = true
        this.ticketDataSource.data = result.data.slice()
        this.tickets = result.data.slice()
        this.shows = [];
        result.data.reduce((_: ShowAPIObject[], ticket: ClientTicketAPIObject, __: number) => {
          if (ticket.event &&
            this.shows.findIndex(show => ticket.event && show._id.toString() == ticket.event._id.toString()) < 0)
            this.shows.push(ticket.event)
        }, this.shows)
        if (typeof this.showFromQuery === "string") {
          this.selectedShow = this.shows.find(show => show._id == this.showFromQuery)
        }
        this.shows.sort((showA, showB) => {
          if (showA.datetime && showB.datetime) {
            return new Date(showA.datetime) > new Date(showB.datetime) ? -1 :
              new Date(showA.datetime) < new Date(showB.datetime) ? 1 : 0
          }
          else {
            if (showA.datetime) {
              return -1
            }
            else if (showB.datetime) {
              return 1
            }
            else {
              return 0

            }
          }
        })
        this.filteredShows = this.showSearch.valueChanges.pipe(
          startWith(''),
          map(value => {
            const keywords = typeof value === 'string' ? value : value?._id;
            return keywords ? this._filter(keywords as string) : this.shows.slice();
          }),
        );
      }
    })
  }
  summary?: {
    round: Map<number, {
      tierInfo: Map<string, {
        tierName: string;
        freed: number;
        count: number;
        price: number;
      }>,
      freed: number;
      count: number;
    }
    >
    totalCost?: number
  }
  showSelected(eventId: string) {
    if (eventId == undefined) return
    this.ticketDataSource.data = this.tickets.filter(ticket => ticket.event?._id.toString() == eventId)
    this.selectedShow = this.shows.find(show => show._id == eventId)
    if (this.selectedShow) {
      let show = this.selectedShow
      let sortedPriceTier = show.priceTiers.sort((a, b) => {
        return a.price - b.price
      })
      let tempSummary =
        this.ticketDataSource.data.sort(ticketCompareByDate).reduce((summary, ticket, ind) => {
          if (ticket.purchaseInfo) {
            let purchaseDate = ticket.purchaseInfo.purchaseDate;


            let saleInfoInd = show.saleInfos.
              findIndex(info => info.start <= purchaseDate && purchaseDate <= info.end)
            let roundInfo = summary.round.get(saleInfoInd)
            let tierName = ticket.priceTier.tierName
            let price = ticket.priceTier.price
            if (roundInfo) {
              let tierInfo = roundInfo.tierInfo.get(tierName)
              if (tierInfo) {
                tierInfo.count += 1
              }
              else {
                roundInfo.tierInfo.set(tierName, { tierName: tierName, count: 1, price: price, freed: 0 })
              }
            }
            else {
              let tierInfo = new Map<string, { tierName: string, count: number, price: number, freed: 0 }>()
              tierInfo.set(tierName, { tierName: tierName, count: 1, price: price, freed: 0 })
              summary.round.set(saleInfoInd, { count: 0, freed: 0, tierInfo: tierInfo })
            }

          }
          return summary
        }, { totalCost: 0, round: new Map<number, { count: number, freed: number, tierInfo: Map<string, { tierName: string, count: number, price: number, freed: number }> }>() })
      tempSummary.totalCost = Array.from(tempSummary.round.entries()).map((round_info) => {
        let round = round_info[0]
        let roundInfo = round_info[1]
        let tierInfo = roundInfo.tierInfo
        let saleInfo
        if (round > -1 && round < show.saleInfos.length) {
          saleInfo = show.saleInfos[round]
          let buyX = saleInfo.buyX
          let yFree = saleInfo.yFree
          let totalTickerCount = Array.from(tierInfo.values()).map(info => info.count).reduce((acc: number, val: number) => acc + val, 0)
          if (buyX == 0 || yFree == 0) {
            roundInfo.freed = 0
            roundInfo.count = totalTickerCount
            return 0
          }
          let freeCount = Math.floor(totalTickerCount / (buyX + yFree)) * yFree;
          roundInfo.freed = freeCount
          roundInfo.count = totalTickerCount
          for (let priceTier of sortedPriceTier) {
            let priceTierInfo = tierInfo.get(priceTier.tierName)
            if (!priceTierInfo) break;
            if (freeCount <= 0) { }
            else {
              priceTierInfo.freed = priceTierInfo.count < freeCount ? priceTierInfo.count : freeCount;
              freeCount -= priceTierInfo.freed
              tierInfo.set(priceTier.tierName, priceTierInfo)
            }
          }
          return Array.from(tierInfo.values()).reduce((acc: number, pt) => acc + (pt.count - pt.freed) * pt.price, 0)
        }
        return 0
      }).reduce((acc: number, val: number) => acc + val, 0);
      this.summary = tempSummary
    }
  }
  ticketConfirmDateString(ticket: ClientTicketAPIObject): string {
    return ticketConfirmDateString(ticket)
  }
  ticketPurchaseDateString(ticket: ClientTicketAPIObject): string {
    return ticketPurchaseDateString(ticket)
  }
}
