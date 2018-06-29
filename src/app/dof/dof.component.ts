import { Component, ViewChild, DoCheck } from '@angular/core';
import json from '../../assets/camera-sensor-data.json';
import { AppServics } from '../app-service.service';
import { Location } from '@angular/common';
import { DofVisualizerComponent } from './dof-visualizer/dof-visualizer.component';
import { Utils } from '../utils';

@Component({
  selector: 'app-dof',
  templateUrl: './dof.component.html',
  styleUrls: ['./dof.component.scss']
})
export class DofComponent {
  @ViewChild(DofVisualizerComponent) dofVisualizer: DofVisualizerComponent;
  private data: any = <any> json;
  public vendors: Set<String> = new Set<String>();
  public selectedModels:Array<any> = new Array<any>();
  public models: {} = {};
  public dataModel = {vendor: '', model: '', aperture: 2.8, focalLength: 55, distance: 10, metric: true};
  public apertures = [];  
  public visualize = false;
  private utils = Utils;
  public result:DofCalculation =  new DofCalculation();

  constructor(private appService: AppServics, private location: Location) {
    for(const camera of this.data) {
      this.vendors.add(camera.CameraMaker);

      if (!(this.models[camera.CameraMaker] instanceof Array)){
        this.models[camera.CameraMaker] = [];
      }

      this.models[camera.CameraMaker].push(camera);
    }

    for(let i = -1; i <= 12; i++) {      
      for(let j = 0; j < 3; j++) {
        let av = (i + j/3.0);               
        let dec_places = i < 6 ? 1 : 0;              
        let aperture_third = Math.round(Math.sqrt(2**av) * 10) / 10;                
        this.apertures.push(Number.parseFloat(aperture_third.toFixed(dec_places)));        
      }      
    }
  }


  public calculateDof() {    
    let camera = this.dataModel.model;
    let sh = camera['SensorHeight(mm)'];
    let sw = camera['SensorWidth(mm)'];    
    let d = Math.sqrt(sw**2 + sh**2);
    let CoC = d / 1500;
    
    let focalLength = this.dataModel.focalLength;
    let s = this.dataModel.distance * 1000; // convert m to mm        

    this.result.calculate(
      focalLength, s,
      this.dataModel.aperture,
      CoC, this.dataModel.metric
    );
  
    if (this.dofVisualizer === undefined)
      return;

    if(!(sw > 35.5)) // is not fullframe     
      focalLength *= Number((43.27 / d).toPrecision(2)); // full frame diagonal = 43.27

    let fov = 2 * Math.atan(sw / (2 * focalLength)); // in rad
    this.dofVisualizer.updateCamera(fov);

    this.dofVisualizer.updateDoF(
      this.dataModel.aperture, 
      focalLength, s,this.result
    );
  }

  public selectVendor(evt:any) {    
    this.selectedModels = this.models[this.dataModel.vendor];    
  }

  public selectModel(evt:any) {
    this.calculateDof();
  }
}

export class DofCalculation {
  public nearLimit: number;
  public farLimit: number;
  public hyperFocal: number;
  public DoF: number;
  public circleOfConfusion: number;
  public isReady = false;
  
  calculate(
    focalLength:number, 
    subjectDistance: number, 
    fstop:number, 
    CoC:number,
    isMetric:boolean) {
    
    
    let H = focalLength + (focalLength ** 2) / (fstop * CoC); // Hyperfocal in mm
    let Hs = subjectDistance *  H;
    let Dn = Hs / (H + subjectDistance);
    let Df = Hs / (H - subjectDistance);
    let DoF = Df - Dn;


    let isInfinity = subjectDistance >= H ; 

    let f = isMetric ? 1 : 3.2808;
    this.hyperFocal = (H / 1000.0) * f;
    this.nearLimit = (Dn / 1000.0) * f;
    this.farLimit =  isInfinity ? Infinity : (Df / 1000.0)  * f;    
    this.DoF = isInfinity ? Infinity : (DoF / 1000.0)  * f;
    this.circleOfConfusion = CoC;
    this.isReady = true;
      
  }

  toString() {
    return {
      nearLimit: this.nearLimit,
      farLimit: this.farLimit,
      hyperFocal: this.hyperFocal,
      DoF: this.DoF,
      CoC: this.circleOfConfusion
    }
  }
}
