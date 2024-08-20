import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { VenueAPIObject } from '../../api-util'
import { ApiService } from '../../service/api.service';
import { VenueFormComponent } from '../../forms/venue-form/venue-form.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-venue-list',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule, MatSortModule,
    MatPaginatorModule, RouterModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './venue-list.component.html',
  styleUrl: './venue-list.component.sass'
})
export class VenueListComponent {
  loaded = false
  venueDataSource: MatTableDataSource<VenueAPIObject> = new MatTableDataSource<VenueAPIObject>()
  venueDataColumn = ['venuename', '_id']
  @Output() dataChanged = new EventEmitter()
  @Input()
  get venues() { return this.venueDataSource.data }
  set venues(value) { this.venueDataSource.data = value }
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  constructor(public dialog: MatDialog, private api: ApiService) {
  }
  ngAfterViewInit() {
    if (this.paginator && this.sort && this.venueDataSource) {
      this.venueDataSource.paginator = this.paginator;
      this.venueDataSource.sort = this.sort;
      //   this.venueDataSource.filterPredicate = (data: any, filter: string) => {
      //     const accumulator = (valueString: string, keys: string) => {
      //       let cursor: any = data;
      //       for (let key of keys.split(".")) {
      //         if (cursor[key]) {
      //           cursor = cursor[key]
      //         }
      //         else {
      //           break;
      //         }
      //       }
      //       if (typeof cursor === "string") {
      //         valueString += cursor
      //       }
      //       return valueString;
      //     };
      //     const dataStr = this.venueDataColumn.reduce(accumulator, '').toLowerCase();
      //     // Transform the filter by converting it to lowercase and removing whitespace.
      //     const transformedFilter = filter.trim().toLowerCase();
      //     return dataStr.indexOf(transformedFilter) !== -1;
      //   };
      //   this.venueDataSource.sortingDataAccessor = (data: any, keys: string) => {
      //     let cursor: any = data;
      //     for (let key of keys.split(".")) {
      //       if (cursor[key]) {
      //         cursor = cursor[key]
      //       }
      //       else {
      //         break;
      //       }
      //     }
      //     return cursor
      //   }
    }
  }
  applyFilter(venue: Event) {
    const filterValue = (venue.target as HTMLInputElement).value;
    if (this.venueDataSource) {
      this.venueDataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  openForm(data: any = {}) {
    const dialogRef = this.dialog.open(VenueFormComponent, {
      data: JSON.parse(JSON.stringify(data)),
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if(result)this.dataChanged.emit()
    })
  }
  delete(id: string) {
    return this.api.request.delete(`/venue/${id}`).toPromise().then(_ => {
      this.dataChanged.emit()
    })
  }

}
