import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-exposure',
  templateUrl: './exposure.component.html',
  styleUrls: ['./exposure.component.scss']
})
export class ExposureComponent implements OnInit {
  public fstopName: string = 'fstop';
  public timeName: string = 'time';
  public isoName: string = 'iso';

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

  public onValueChanged(elementName: string) {
    if(!this.evLocked) {
      this.updateCurrentEV();
    }
    
    else {
      debugger;
      switch(elementName) {
        case 'iso':
          // ISO fallthrough to time update for now
        case 'fstop':
          // F-stop changed, update to equivalent exposure time
          this.currentTime = ExposureComponent.calculateTimeValue(this.currentFStop, this.currentISO, this.currentEV);
          break;

        case 'time':
          // Exposure time changed, update to equivalent f-stop
          this.currentFStop = ExposureComponent.calculateFStop(this.currentEV, this.currentISO, this.currentTime);
          break;
      }
    }
  }

  public onButtonStateChange() {
    this.evLocked = !this.evLocked;
  }

  private updateCurrentEV() {
      // Calculate the exposure value of the current settings
      this.currentEV = ExposureComponent.calculateExposureValue(this.currentFStop, this.currentISO, this.currentTime);
  }



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
