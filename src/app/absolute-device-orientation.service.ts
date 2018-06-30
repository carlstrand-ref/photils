import { Injectable } from '@angular/core';
import { Utils } from './utils';
import { Observer, Observable } from 'rxjs';


declare const window: any;
@Injectable({
  providedIn: 'root'
})
export class AbsoluteDeviceOrientationService {
  private isActive = false;
  private isReady = false;
  private deviceOrientationDataTimeout:number = 2000;

  private  _orientationReadyObserver:Observer<AbsoluteDeviceOrientationResult>;
  readonly deviceOrientationReady = new Observable((observer) => {    
    if(!this.isActive) this.addListener();
    this._orientationReadyObserver = observer;
  });

  private _orientationChangedObserver:Observer<AbsoluteDeviceOrientationResult>;
  readonly deviceOrientationChanged = new Observable((observer) => {
    if(!this.isActive) this.addListener();
    this._orientationChangedObserver = observer;
  });
  

  constructor() {}

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
        if(this._orientationReadyObserver)
          this._orientationReadyObserver.error(e);

        if(this._orientationChangedObserver)
          this._orientationChangedObserver.error(e);        
      }
    }, this.deviceOrientationDataTimeout);
  }

  private handleChange(e) {     
    // https://developers.google.com/web/updates/2016/03/device-orientation-changes
    // values explained https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained    
    if((e.compassHeading || e.webkitCompassHeading || e.absolute) && e.alpha !== null) {
      this.isReady = true;
      let evt = new AbsoluteDeviceOrientationResult(e);

      if(this._orientationReadyObserver) {        
        this._orientationReadyObserver.next(evt);
        this._orientationReadyObserver.complete();
      }

      if(this._orientationChangedObserver) {
        this._orientationChangedObserver.next(evt);
      }
    }
  }
}

export class AbsoluteDeviceOrientationResult {  
  readonly alpha: number;
  readonly beta: number; 
  readonly gamma:number;

  constructor(e: any ) {
    let heading = e.compassHeading || e.webkitCompassHeading || Utils.compassHeading(e.alpha, e.beta, e.gamma);
    this.alpha = heading;
    this.beta = e.beta;
    this.gamma = e.gamma;

    this.alpha = this.normalize();
  }

  private normalize() : number {
    let key = Utils.getKeyFromUserAgent();
    let normalizedAlpha:number;    
    switch(key) {
      case "ios":
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
        normalizedAlpha = this.alpha;
    }

    return normalizedAlpha;
  }
}