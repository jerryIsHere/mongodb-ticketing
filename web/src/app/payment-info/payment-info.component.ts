import { Component, ViewChild, Input } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatTabsModule } from '@angular/material/tabs';
import { Ticket } from '../interface'
import { ApiService } from '../service/api.service';

@Component({
  selector: 'app-payment-info',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule, MatSortModule, MatCheckboxModule, MatTabsModule],
  templateUrl: './payment-info.component.html',
  styleUrl: './payment-info.component.scss'
})
export class PaymentInfoComponent {
  loaded = false
  summary: { events: Set<string>, price: number, } = { events: new Set<string>(), price: 0, }
  ticketDataSource: MatTableDataSource<Ticket> = new MatTableDataSource<Ticket>()
  ticketDataColumn = ['seat', 'priceTier.price', 'paid', 'paymentRemark'];
  @Input()
  set ids(id: string[]) {
    this.loadData(id)
  }
  @ViewChild(MatSort) sort?: MatSort;
  constructor(private api: ApiService) {
  }
  ngAfterViewInit() {
    if (this.sort && this.ticketDataSource) {
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
        const dataStr = this.ticketDataColumn.reduce(accumulator, '').toLowerCase();
        // Transform the filter by converting it to lowercase and removing whitespace.
        const transformedFilter = filter.split("+").map(f => f.trim().toLowerCase());
        return transformedFilter.filter(f => dataStr.indexOf(f) !== -1).length == transformedFilter.length;
      };
      this.ticketDataSource.sortingDataAccessor = valueAccessor
    }
  }
  loadData(ids: string[]) {
    return this.api.request.get("/ticket?list=" + encodeURIComponent(JSON.stringify(ids))).toPromise().then((result: any) => {
      if (result && result.data) {
        this.loaded = true
        this.ticketDataSource.data = result.data
        result.data.reduce((obj: { events: Set<string>, price: number, }, ticket: Ticket, ind: number) => {
          if (ticket.event?.eventname)
            obj.events.add(ticket.event.eventname)
          if (ticket.priceTier.price)
            obj.price += Number(ticket.priceTier.price)
          return obj
        }, this.summary)
      }
    })
  }
}

