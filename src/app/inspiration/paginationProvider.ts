import {MatPaginatorIntl} from '@angular/material';
export class PaginationProvider extends MatPaginatorIntl {

  getRangeLabel = function(page: number, pageSize: number, length: number) : string { 
    if (length === 0 || pageSize == 0) { 
      return `0 of ${pageSize}`; 
    } 

    console.log(page, pageSize, length);
  
    length = Math.ceil(length / pageSize);   
    return `Page ${page + 1} of ${length}`    
  }

}