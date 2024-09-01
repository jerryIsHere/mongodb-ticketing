import { Component, ViewChild, Input, Output, EventEmitter, } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { AdminTicketAPIObject, UserAPIObject, ticketConfirmDateString, ticketPurchaseDateString, ticketCompareByDate, ShowAPIObject, ticketCompare, summarizeTicket, TicketAPIObject } from '../../api-util'
import { ApiService } from '../../service/api.service';
import { TicketFormComponent } from '../../forms/ticket-form/ticket-form.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import dateFormat, { masks } from "dateformat";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const colorshex = "66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3" // 8 colors for pricetiers

@Component({
  selector: 'app-customer-ticket',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule, MatListModule,
    FormsModule, MatDividerModule, MatCheckboxModule,
    MatFormFieldModule, MatChipsModule,
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
  priceTiersColors?: Map<string, string>
  eventExportOption: { includeUnsold: boolean, specificToSelectedUser: boolean }
    = { includeUnsold: false, specificToSelectedUser: false }

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
        this.ticketDataSource.data = [...this.tickets]
        console.log(ticket)
        this.summarize()
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
            this.summary = undefined;
            this.selectedShow = undefined;
            this.priceTiersColors = undefined
            const keywords = typeof value === 'string' ? value : value?._id;
            return keywords ? this._showFilter(keywords as string) : this.shows.slice();
          }),
        );
      }
    }))
    promises.push(this.api.request.get("/ticket?list&sold&populate=full").toPromise().then((result: any) => {
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
            this.summary = undefined;
            this.selectedUser = undefined;
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
  summary?: {
    round: Map<number, {
      tierInfo: Map<string, {
        tierName: string;
        freed: number;
        count: number;
        price: number;
        tickets: (AdminTicketAPIObject & { freed?: boolean })[]
      }>,
      freed: number;
      count: number;
      total: number;
    }
    >
    totalCost?: number
  }
  userSelected(event: MatAutocompleteSelectedEvent) {
    if (event?.option?.value?._id) {
      this.selectedUser = this.users.find(user => user._id == event?.option?.value?._id)
    }
    else {
      this.summary = undefined
    }
    if (this.selectedUser && this.selectedShow)
      this.summarize()
  }
  summarize() {
    if (this.selectedUser && this.selectedShow) {

      let show = this.selectedShow
      let user = this.selectedUser
      this.priceTiersColors = new Map<string, string>()
      var colors = "" + (' ' + colorshex).slice(1);
      for (let priceTier of show.priceTiers) {
        let c = colors.slice(0, 6)
        this.priceTiersColors.set(priceTier.tierName, c)
        if (colors.length <= 6) break;
        colors = colors.slice(6, colors.length)
      }
      let userTicket =
        this.tickets.filter(ticket => ticket.event?._id == show._id && ticket.purchaseInfo?.purchaser?._id == user._id)
      this.summary = summarizeTicket<AdminTicketAPIObject>(userTicket, show);
    }
  }

  showSelected(eventId: string) {
    if (eventId != undefined) {
      this.selectedShow = this.shows.find(show => show._id.toString() == eventId)
    }
    else {
      this.summary = undefined
    }
    if (this.selectedUser && this.selectedShow)
      this.summarize()

  }
  ticketConfirmDateString(ticket: AdminTicketAPIObject): string {
    return ticketConfirmDateString(ticket)
  }
  ticketPurchaseDateString(ticket: AdminTicketAPIObject): string {
    return ticketPurchaseDateString(ticket)
  }
  downloadAllTicketDataCSV(show: ShowAPIObject, ticketData: AdminTicketAPIObject[]) {
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
        ...ticketData.map(ticket =>
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
          "paymentInfo" in ticket ? ticket.paymentInfo?.confirmedBy : '',
          "paymentInfo" in ticket ? ticket.paymentInfo?.remark : '',
          ].map(value => value ? value : '').join(",")
        )
      ].join("\n")

    var link = document.createElement("a");
    link.setAttribute("href", encodeURI(data));
    link.setAttribute("download", `ticketing-${show.eventname}-all_ticket-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
  }


  downloadDiscountDataCsv(show: ShowAPIObject, ticketData: AdminTicketAPIObject[]) {
    let userSoldTicket = ticketData.reduce((bin, ticket) => {
      if (ticket.purchaseInfo && ticket.purchaseInfo.purchaser) {
        if (this.eventExportOption.specificToSelectedUser && this.selectedUser &&
          ticket.purchaseInfo.purchaser._id != this.selectedUser._id
        ) {
          return bin
        }
        let userId = ticket.purchaseInfo.purchaser._id
        let userTickets = bin.get(userId)
        if (userTickets) {
          userTickets.push(ticket)
          bin.set(userId, userTickets)
        }
        else {
          bin.set(userId, [ticket])
        }
      }
      return bin
    }, new Map<string, AdminTicketAPIObject[]>())
    function* userRow() {
      for (let userTickets of userSoldTicket.values()) {
        let user = userTickets[0].purchaseInfo?.purchaser
        if (user) {
          let userSummary = summarizeTicket(userTickets, show);
          yield ""
          yield `ticket info of ${user.fullname} (${user.username}) total: $${userSummary.totalCost}`
          for (let roundNinfo of [...userSummary.round.entries()].sort()) {
            yield `round ${roundNinfo[0] + 1} [sum: $${roundNinfo[1].total}] [free/total: ${roundNinfo[1].freed}/${roundNinfo[1].count}]`
            for (let tierNinfo of [...roundNinfo[1].tierInfo.entries()].sort()) {
              yield `tier ${tierNinfo[0]} sum: $${(tierNinfo[1].count - tierNinfo[1].freed) * tierNinfo[1].price
                } free/total: ${tierNinfo[1].freed}/${tierNinfo[1].count}`
              for (let ticket of tierNinfo[1].tickets) {
                yield [ticket._id,
                ticket.seat?.row && ticket.seat?.no ? ticket.seat?.row + ticket.seat?.no : '',
                ticket.priceTier.tierName,
                ticket.freed ? "free" : ticket.priceTier.price,
                "purchaseInfo" in ticket && ticket.purchaseInfo?.purchaseDate ?
                  dateFormat(new Date(ticket.purchaseInfo?.purchaseDate)) : '',
                "paymentInfo" in ticket && ticket.paymentInfo?.confirmationDate ?
                  dateFormat(new Date(ticket.paymentInfo?.confirmationDate)) : '',
                "paymentInfo" in ticket ? ticket.paymentInfo?.confirmedBy : '',
                "paymentInfo" in ticket ? ticket.paymentInfo?.remark : '',
                ].map(value => value ? value : '').join(",")
              }
            }
          }
        }
      }
    }
    var data = "data:text/csv;charset=utf-8," +
      [
        "event info",
        [
          "_id",
          "eventname",
          "datetime",
          "duration",
          "price tiers",
          // "saleInfos",
        ].join(","),
        [
          show._id.toString(),
          show.eventname,
          dateFormat(new Date(show.datetime)),
          show.duration + " m",
          show.priceTiers.map(pt => `${pt.tierName}:$${pt.price}`).join(' & '),
          // show.saleInfos,
        ].join(","),
        "",
        [
          "_id",
          "seat.row+seat.no",
          "priceTier.tierName",
          "priceTier.price",
          "purchaseDate",
          "confirmationDate",
          "confirmationType",
          "remark"].join(","),
        ...userRow(),
      ].join("\n")
    console.log(data)
    var link = document.createElement("a");
    let reportDesc = this.eventExportOption.specificToSelectedUser && this.selectedUser ? `${this.selectedUser.username}` : 'all_user'
    link.setAttribute("href", encodeURI(data));
    link.setAttribute("download", `ticketing-${show.eventname}-sold_ticket-${reportDesc}-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
  }

  downloadEventDataCSV() {
    if (this.selectedShow) {
      let includeUnsold = this.eventExportOption.includeUnsold && !(this.eventExportOption.specificToSelectedUser && this.selectedUser)
      let show = this.selectedShow
      this.api.request.get(`/ticket?eventId=${show._id}${includeUnsold ? '&populate=full' : '&sold&populate=full'}`).toPromise().then((result: any) => {
        includeUnsold ? this.downloadAllTicketDataCSV(show, result.data) : this.downloadDiscountDataCsv(show, result.data)
      })
    }
  }
}