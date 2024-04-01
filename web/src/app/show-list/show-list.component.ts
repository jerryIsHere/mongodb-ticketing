import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { DatetimeOffsetPipe } from '../pipes/datetime-offset.pipe';
import { Show } from '../interface'
import { ApiService } from '../service/api.service';
@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule, MatSortModule, MatPaginatorModule,
    RouterModule, MatButtonModule, DatePipe, DatetimeOffsetPipe],
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.sass'
})
export class ShowListComponent {
  loaded = false
  eventDataSource: MatTableDataSource<Show[]> = new MatTableDataSource<Show[]>()
  eventDataColumn = ['eventname', 'datetime', 'duration', 'venue.venuename', '_id'];
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  constructor(private api: ApiService) {
    this.loadData()
  }
  ngAfterViewInit() {
    if (this.paginator && this.sort && this.eventDataSource) {
      this.eventDataSource.paginator = this.paginator;
      this.eventDataSource.sort = this.sort;
      this.eventDataSource.filterPredicate = (data: any, filter: string) => {
        const accumulator = (valueString: string, keys: string) => {
          let cursor: any = data;
          for (let key of keys.split(".")) {
            if (cursor[key]) {
              cursor = cursor[key]
            }
            else {
              break;
            }
          }
          if (typeof cursor === "string") {
            valueString += cursor
          }
          return valueString;
        };
        const dataStr = this.eventDataColumn.reduce(accumulator, '').toLowerCase();
        // Transform the filter by converting it to lowercase and removing whitespace.
        const transformedFilter = filter.split("+").map(f => f.trim().toLowerCase());
        return transformedFilter.filter(f => dataStr.indexOf(f) !== -1).length == transformedFilter.length;
      };
      this.eventDataSource.sortingDataAccessor = (data: any, keys: string) => {
        let cursor: any = data;
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
  }
  loadData() {
    return this.api.request.get("/event?list").toPromise().then((result: any) => {
      if (result && result.data) {
        this.loaded = true
        this.eventDataSource.data = result.data
      }
    })
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.eventDataSource) {
      this.eventDataSource.filter = filterValue.trim().toLowerCase();
    }
  }
}
