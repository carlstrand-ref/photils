import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exposure',
  templateUrl: './exposure.component.html',
  styleUrls: ['./exposure.component.css']
})
export class ExposureComponent implements OnInit {
  public option: string = 'none';

  ngOnInit() {
    console.warn(ExposureComponent.calculateTimeValue(5.6, 100, 8.3));
  }

  change() {
    console.warn(this.option);
  }

  private static calculateExposureValue(fstop: number, iso: number, time: number): number {
    return Math.log2(100 * Math.pow(fstop, 2) / (iso * time))
  }

  private static calculateFStop(ev: number, iso: number, time: number): number {
    return Math.sqrt((Math.pow(2, ev) * iso * time) / 100);
  }

  private static calculateISOValue(fstop: number, ev: number, time: number): number {
    return 100 * Math.pow(fstop, 2) * time / Math.pow(2, ev);
  }

  private static calculateTimeValue(fstop: number, iso: number, ev: number): number {
    return 100 * Math.pow(fstop, 2) / (iso * Math.pow(2, ev));
  }

}
