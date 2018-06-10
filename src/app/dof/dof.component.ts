import { Component, OnInit } from '@angular/core';

import * as data from '../../assets/camera-sensor-data.json';
@Component({
  selector: 'app-dof',
  templateUrl: './dof.component.html',
  styleUrls: ['./dof.component.css']
})
export class DofComponent implements OnInit {
  public data:any[] = data as any[];

  constructor() {
    
  }

  ngOnInit() {
  }

}
