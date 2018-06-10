import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exposure',
  templateUrl: './exposure.component.html',
  styleUrls: ['./exposure.component.css']
})
export class ExposureComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.warn(ExposureComponent.calculateExposureValue(5.6, 100, 0.1));
  }

  private static calculateExposureValue(fstop: number, iso: number, time: number): number {
    return Math.log2(100 * Math.pow(fstop, 2) / (iso * time))
  }

}
