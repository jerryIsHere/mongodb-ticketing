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
import { AdminTicketAPIObject, UserAPIObject, ticketConfirmDateString, ticketPurchaseDateString, ticketCompareByDate, ShowAPIObject } from '../../interface-util'
import { ApiService } from '../../service/api.service';
import { TicketFormComponent } from '../../forms/ticket-form/ticket-form.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import dateFormat, { masks } from "dateformat";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-customer-ticket',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule,
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe, DatePipe],
  templateUrl: './customer-ticket.component.html',
  styleUrl: './customer-ticket.component.sass'
})
export class CustomerTicketComponent {
  ticketLoaded = false
  ticketDataSource: MatTableDataSource<AdminTicketAPIObject> = new MatTableDataSource<AdminTicketAPIObject>()
  ticketDataColumn = ['event.eventname', 'seat', 'priceTier.tierName', 'priceTier.price', 'purchaseInfo.purchaseDate', '_id', 'paymentInfo.confirmedBy'];
  users: UserAPIObject[] = [];
  tickets: AdminTicketAPIObject[] = []
  shows: ShowAPIObject[] = [];
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  userSearch = new FormControl<string | UserAPIObject>('');
  showSearch = new FormControl<string | ShowAPIObject>('');
  filteredUsers: Observable<UserAPIObject[]> = new Observable<UserAPIObject[]>();
  filteredShows: Observable<ShowAPIObject[]> = new Observable<ShowAPIObject[]>();
  selectedUser?: UserAPIObject;
  selectedShow?: ShowAPIObject

  constructor(public dialog: MatDialog, private api: ApiService) {
    this.loadData()
  }

  showDisplayFn(event: ShowAPIObject): string {
    return event && event.eventname ? event.eventname : '';
  }

  userDisplayFn(user: UserAPIObject): string {
    return user ? (user.fullname ? user.fullname : '') + (user.username ? `(${user.username})` : '') : '';
  }
  private _userFilter(keywords: string): UserAPIObject[] {
    const filterValue = keywords.toLowerCase();
    if (this.users) {
      return this.users.filter(user =>
        user.fullname?.toLowerCase().includes(filterValue) ||
        user.singingPart?.toLowerCase()?.includes(filterValue) ||
        user.email?.toLowerCase()?.includes(filterValue) ||
        user.username?.toLowerCase()?.includes(filterValue) ||
        user._id?.toLowerCase()?.includes(filterValue)
      );
    }
    else {
      return []
    }
  }
  private _showFilter(keywords: string): ShowAPIObject[] {
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
        const dataStr = ['purchaseinfo.purchaser.email', 'purchaseinfo.purchaser.username', ...this.ticketDataColumn].reduce(accumulator, '').toLowerCase();
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
  openForm(data: AdminTicketAPIObject) {
    const dialogRef = this.dialog.open(TicketFormComponent, {
      data: JSON.parse(JSON.stringify(data)),
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      let ticket = result as AdminTicketAPIObject
      if (ticket) {
        if (result.voided) {
          this.tickets = this.tickets.filter(t => t._id != ticket._id)
        }
        else {
          let ticketInd = this.tickets.findIndex(t => t._id == ticket._id)
          if (ticketInd > -1) this.tickets[ticketInd] = ticket
        }
        if (this.summary?.userId) {
          this.summarize(this.summary.userId)
        }
        else {
          this.ticketDataSource.data = this.tickets.slice()
        }
      }
    })
  }
  dataLoaded = false
  loadData() {
    let promises = []
    promises.push(this.api.request.get("/event?list").toPromise().then((result: any) => {
      if (result && result.data) {
        this.shows = result.data
        this.filteredShows = this.showSearch.valueChanges.pipe(
          startWith(''),
          map(value => {
            const keywords = typeof value === 'string' ? value : value?._id;
            return keywords ? this._showFilter(keywords as string) : this.shows.slice();
          }),
        );
      }
    }))
    promises.push(this.api.request.get("/ticket?list&sold").toPromise().then((result: any) => {
      if (result && result.data) {
        this.ticketLoaded = true
        this.tickets = result.data
        this.ticketDataSource.data = this.tickets
      }
    }))
    promises.push(this.api.request.get("/user?list").toPromise().then((result: any) => {
      if (result && result.data) {
        this.users = result.data
        this.filteredUsers = this.userSearch.valueChanges.pipe(
          startWith(''),
          map(value => {
            const keywords = typeof value === 'string' ? value : value?.username;
            return keywords ? this._userFilter(keywords as string) : this.users.slice();
          }),
        );
      }
    }))
    return Promise.all(promises).then(_ => {
      this.dataLoaded = true
    })
  }
  summary: any

  userSelected(event: MatAutocompleteSelectedEvent) {
    if (event?.option?.value?._id) {
      this.selectedUser = this.users.find(user => user._id == event?.option?.value?._id)
    }
    if (this.selectedUser && this.selectedShow)
      this.summarize()
  }
  summarize() {
    if (this.selectedUser && this.selectedShow) {
      let show = this.selectedShow
      let user = this.selectedUser
      let sortedPriceTier = show.priceTiers.sort((a, b) => {
        return a.price - b.price
      })
      let tempSummary =
        this.tickets.filter(ticket => ticket.event?._id == show._id && ticket.purchaseInfo?.purchaser?._id == user._id).
          sort(ticketCompareByDate).reduce((summary, ticket, ind) => {
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
            if (freeCount <= 0) break;
            let priceTierInfo = tierInfo.get(priceTier.tierName)
            if (priceTierInfo) {
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

  showSelected(eventId: string) {
    if (eventId == undefined) return
    this.selectedShow = this.shows.find(show => show._id.toString() == eventId)
    if (this.selectedUser && this.selectedShow)
      this.summarize()

  }
  ticketConfirmDateString(ticket: AdminTicketAPIObject): string {
    return ticketConfirmDateString(ticket)
  }
  ticketPurchaseDateString(ticket: AdminTicketAPIObject): string {
    return ticketPurchaseDateString(ticket)
  }
  downloadUserDataCSV() {
    this.loadData().then(() => {
      var data = "data:text/csv;charset=utf-8," +
        [
          ["_id", "username", "fullname", "email", "singingPart", "lastLoginDate", "latestTicketPurchaseDate", "latestTicketConfirmDate", "latestTicketConfirmationType",
            "latestTicketRemark",].join(","),
          ...this.users.map(user => {
            let sortedTicket = this.tickets.filter(ticket =>
              "purchaseInfo" in ticket && ticket.purchaseInfo?.purchaser?._id.toString() == user._id).sort(ticketCompareByDate)
            let lastTicket = sortedTicket.length > 0 && "purchaseInfo" in sortedTicket[0] ? sortedTicket[0] : null
            return [
              user._id,
              user.username,
              user.fullname,
              user.email,
              user.singingPart,
              user.lastLoginDate ? dateFormat(new Date(user.lastLoginDate), 'yyyymmdd hhmmss') : '',
              lastTicket ? lastTicket.purchaseInfo ? dateFormat(new Date(lastTicket.purchaseInfo.purchaseDate), 'yyyymmdd hhmmss') : '' : '',
              lastTicket ? lastTicket.paymentInfo ? dateFormat(new Date(lastTicket.paymentInfo.confirmationDate), 'yyyymmdd hhmmss') : '' : '',
              lastTicket ? lastTicket.paymentInfo?.confirmer?.username : '',
              lastTicket ? lastTicket.paymentInfo?.remark : '',

            ].map(value => value ? value : '').join(",")
          }
          )
        ].join("\n")

      var link = document.createElement("a");
      link.setAttribute("href", encodeURI(data));
      link.setAttribute("download", `user-${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
    })
  }
  downloadSoldTicketDataCSV() {
    this.loadData().then(() => {
      var data = "data:text/csv;charset=utf-8," +
        [
          ["_id",
            "event.eventname",
            "seat.row+seat.no",
            "priceTier.tierName",
            "priceTier.price",
            "purchaser.username",
            "purchaser.fullname",
            "purchaseDate",
            "confirmationDate",
            "confirmationType",
            "remark"].join(","),
          ...this.tickets.map(ticket =>
            [ticket._id,
            ticket?.event?.eventname,
            ticket.seat?.row && ticket.seat?.no ? ticket.seat?.row + ticket.seat?.no : '',
            ticket.priceTier.tierName,
            ticket.priceTier.price,
            "purchaseInfo" in ticket ? ticket.purchaseInfo?.purchaser?.username : '',
            "purchaseInfo" in ticket ? ticket.purchaseInfo?.purchaser?.fullname : '',
            "purchaseInfo" in ticket && ticket.purchaseInfo?.purchaseDate ?
              dateFormat(new Date(ticket.purchaseInfo?.purchaseDate)) : '',
            "paymentInfo" in ticket && ticket.paymentInfo?.confirmationDate ?
              dateFormat(new Date(ticket.paymentInfo?.confirmationDate)) : '',
            "paymentInfo" in ticket ? ticket.paymentInfo?.confirmer?.username : '',
            "paymentInfo" in ticket ? ticket.paymentInfo?.remark : '',
            ].map(value => value ? value : '').join(",")
          )
        ].join("\n")

      var link = document.createElement("a");
      link.setAttribute("href", encodeURI(data));
      link.setAttribute("download", `ticketing-${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
    })
  }
}