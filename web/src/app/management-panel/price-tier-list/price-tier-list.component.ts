import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { IPriceTier } from '../../../../../mongoose-schema/interface_util'
import { ApiService } from '../../service/api.service';
import { PriceTierFormComponent } from '../../forms/price-tier-form/price-tier-form.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-price-tier-list',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule, MatSortModule,
    MatPaginatorModule, RouterModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './price-tier-list.component.html',
  styleUrl: './price-tier-list.component.sass'
})
export class PriceTierListComponent {
  loaded = false
  priceTierDataSource: MatTableDataSource<IPriceTier> = new MatTableDataSource<IPriceTier>()
  priceTierDataColumn = ['tierName', 'price', '_id']
  @Output() dataChanged = new EventEmitter()
  @Input()
  get priceTiers() { return this.priceTierDataSource.data }
  set priceTiers(value) { this.priceTierDataSource.data = value }
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  constructor(public dialog: MatDialog, private api: ApiService) {
  }
  ngAfterViewInit() {
    if (this.paginator && this.sort && this.priceTierDataSource) {
      this.priceTierDataSource.paginator = this.paginator;
      this.priceTierDataSource.sort = this.sort;
      //   this.priceTierDataSource.filterPredicate = (data: any, filter: string) => {
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
      //     const dataStr = this.priceTierDataColumn.reduce(accumulator, '').toLowerCase();
      //     // Transform the filter by converting it to lowercase and removing whitespace.
      //     const transformedFilter = filter.trim().toLowerCase();
      //     return dataStr.indexOf(transformedFilter) !== -1;
      //   };
      //   this.priceTierDataSource.sortingDataAccessor = (data: any, keys: string) => {
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
  applyFilter(priceTier: Event) {
    const filterValue = (priceTier.target as HTMLInputElement).value;
    if (this.priceTierDataSource) {
      this.priceTierDataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  openForm(data: any = {}) {
    const dialogRef = this.dialog.open(PriceTierFormComponent, {
      data: JSON.parse(JSON.stringify(data)),
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) this.dataChanged.emit()
    })
  }
  delete(id: string) {
    return this.api.request.delete(`/priceTier/${id}`).toPromise().then(_ => {
      this.dataChanged.emit()
    })
  }

}
