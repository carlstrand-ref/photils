import { Injectable, Output, EventEmitter  } from '@angular/core';
import json from '../assets/camera-sensor-data.json';

@Injectable({
  providedIn: 'root'
})
export class AppDataServics {
  public readonly vendors: Set<String> = new Set<String>();
  public models: {} = {};
  private cameraData:any = json;

  public selectedModels:Array<any> = [];

  constructor() {
    this.initCameraData()
  }

  private initCameraData() {
    for(const camera of this.cameraData) {
      this.vendors.add(camera.CameraMaker);

      if (!(this.models[camera.CameraMaker] instanceof Array)){
        this.models[camera.CameraMaker] = [];
      }

      this.models[camera.CameraMaker].push(camera);
    }
  }

  public getModels(vendor:string): any {
    return this.models[vendor];
  }
}
