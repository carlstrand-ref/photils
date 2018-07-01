import { Injectable } from '@angular/core';
import { Utils } from './utils';
import { Observer, Observable, Subject } from 'rxjs';


declare const window: any;
@Injectable({
  providedIn: 'root'
})
export class AbsoluteDeviceOrientationService {
  private isActive = false;
  private isReady = false;
  private deviceOrientationDataTimeout:number = 2000;

  readonly deviceOrientationReady = new Subject<AbsoluteDeviceOrientationResult>();
  readonly deviceOrientationChanged = new Subject<AbsoluteDeviceOrientationResult>()


  constructor() {
    if(!this.isActive) this.addListener();
  }

  private addListener() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => { this.handleChange(e)}, false);
      window.addEventListener('deviceorientationabsolute', (e) => { this.handleChange(e)}, false);
      this.checkOrientationData();
      this.isActive = true;
    }
  }

  private removeListener() {
    if(this.isActive) {
      window.removeListener('deviceorientation')
    }
  }

  private checkOrientationData() {
    setTimeout(()=> {
      try {
        if(!this.isReady)
          throw Error('Timeout in deviceorientationabsolute Event. No orientation data were received.');

      } catch (e) {
        this.deviceOrientationReady.error(e);
        this.deviceOrientationChanged.error(e);
      }
    }, this.deviceOrientationDataTimeout);
  }

  private handleChange(e) {
    // https://developers.google.com/web/updates/2016/03/device-orientation-changes
    // values explained https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
    if((e.compassHeading || e.webkitCompassHeading || e.absolute) && e.alpha !== null) {
      let evt = new AbsoluteDeviceOrientationResult(e);


      if(!this.isReady) {
        this.deviceOrientationReady.next(evt);
        this.deviceOrientationReady.complete();
      }

      this.deviceOrientationChanged.next(evt);
      this.isReady = true;
    }
  }
}

export class AbsoluteDeviceOrientationResult {
  readonly alpha: number = 0;
  readonly beta: number = 0;
  readonly gamma:number = 0;

  constructor(e: any ) {
    if(!e.alpha)
      return;

    let heading = e.compassHeading || e.webkitCompassHeading || Utils.compassHeading(e.alpha, e.beta, e.gamma);
    this.alpha = heading;
    this.beta = e.beta;
    this.gamma = e.gamma;

    this.alpha = this.normalize();
  }

  private normalize() : number {
    let key = Utils.getKeyFromUserAgent();
    let normalizedAlpha:number = this.alpha;
    switch(key) {
      case "firefox":
      normalizedAlpha *= -1;
      break;

      case "android_stock":
      normalizedAlpha = (normalizedAlpha + 270) % 360;
      break;

      case "android_chrome":
      case "opera":
      case "unknown":
      default:
        break;
    }


    console.log("norm", normalizedAlpha);
    return normalizedAlpha;
  }
}