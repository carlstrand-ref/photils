import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exposure',
  templateUrl: './exposure.component.html',
  styleUrls: ['./exposure.component.css']
})
export class ExposureComponent implements OnInit {
  public option: string = 'fstop';
  public fstop: number = 5.6;
  public iso: number = 100;
  public time: number = 0.125;
  public exposure: number = 8;

  ngOnInit() {
    this.change();
  }

  change() {
    switch(this.option) {
      case 'fstop':
        this.fstop = ExposureComponent.calculateFStop(this.exposure, this.iso, this.time);
        break;
      
      case 'iso':
        this.iso = ExposureComponent.calculateISOValue(this.fstop, this.exposure, this.time);
        break;

      case 'time':
        this.time = ExposureComponent.calculateTimeValue(this.fstop, this.iso, this.exposure);
        break;

      case 'exposure':
        this.exposure = ExposureComponent.calculateExposureValue(this.fstop, this.iso, this.time);
        break;
    }
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
