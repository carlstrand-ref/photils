import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-exposure',
  templateUrl: './exposure.component.html',
  styleUrls: ['./exposure.component.scss']
})
export class ExposureComponent implements OnInit {
  public option: string = 'fstop';

  // Setting fields
  public currentFStop: number = 5.6;
  public currentISO: number = 100;
  public currentTime: number = 0.125;
  public currentEV: number = null;
  public evLocked: boolean = false;

  public constructor(private location: Location) {}
  
  public ngOnInit() {
    this.updateCurrentEV();
  }

  public elementOnBlur(e) {
    if(!this.evLocked) {
      this.updateCurrentEV();
    }
    
    else {

    }
  }

  public buttonOnClick() {
    
  }

  private updateCurrentEV() {
      // Calculate the exposure value of the current settings
      this.currentEV = ExposureComponent.calculateExposureValue(this.currentFStop, this.currentISO, this.currentTime);
  }

  /*switch(this.option) {
    case 'fstop':
      this.targetFStop = ExposureComponent.calculateFStop(currentEV, this.targetISO, this.targetTime);
      this.targetFStop = Number(this.targetFStop.toPrecision(2));
      break;
    
    case 'iso':
      this.targetISO = ExposureComponent.calculateISOValue(this.targetFStop, currentEV, this.targetTime);
      break;

    case 'time':
      this.targetTime = ExposureComponent.calculateTimeValue(this.targetFStop, this.targetISO, currentEV);
      this.targetTime = Number(this.targetTime.toPrecision(2));
      break;
  }*/

  private static calculateExposureValue(fstop: number, iso: number, time: number): number {
    return Math.round(Math.log2(100 * Math.pow(fstop, 2) / (iso * time)));
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
