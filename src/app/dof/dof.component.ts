import { Component, ViewChild } from '@angular/core';
import json from '../../assets/camera-sensor-data.json';
import { AppServics } from '../app-service.service';
import { Location } from '@angular/common';
import { DofVisualizerComponent } from './dof-visualizer/dof-visualizer.component';


@Component({
  selector: 'app-dof',
  templateUrl: './dof.component.html',
  styleUrls: ['./dof.component.css']
})
export class DofComponent {
  @ViewChild(DofVisualizerComponent) dofVisualizer: DofVisualizerComponent;
  private data: any = <any> json;
  public vendors: Set<String> = new Set<String>();
  public selectedModels:Array<any> = new Array<any>();
  public models: {} = {};
  public dataModel = {vendor: '', model: '', aperture: 2.8, focalLength: 55, distance: 10, metric: true};
  public apertures = [];  

  constructor(private appService: AppServics, private location: Location) {
    for(const camera of this.data) {
      this.vendors.add(camera.CameraMaker);

      if (!(this.models[camera.CameraMaker] instanceof Array)){
        this.models[camera.CameraMaker] = [];
      }

      this.models[camera.CameraMaker].push(camera);
    }


    for(let i = -1; i <= 12; i++) {      
      let aperture = Math.sqrt(2)**(i);
      for(let j = 0; j < 3; j++) {
        let av = (i + j/3.0);               
        let dec_places = i < 6 ? 1 : 0;              
        let aperture_third = Math.round(Math.sqrt(2**av) * 10) / 10;                
        this.apertures.push(Number.parseFloat(aperture_third.toFixed(dec_places)));        
      }      
    }
  }

  private calculateDof() {    
    let camera = this.dataModel.model;
    let sh = camera['SensorHeight(mm)'];
    let sw = camera['SensorWidth(mm)'];    
    let d = Math.sqrt(sw**2 + sh**2);
    let CoC = d / 1500;
    let focalLength = this.dataModel.focalLength;
    let s = this.dataModel.distance * 1000; // convert m to mm
    let fullFrame = sw > 35.5;
    
    if(!this.dataModel.metric)
      s = this.dataModel.distance *  0.3048 * 1000;
  
    let H = focalLength + (focalLength ** 2) / (this.dataModel.aperture * CoC); // Hyperfocal in mm
    let Hs = s *  H;
    let Dn = Hs / (H + s);
    let Df = Hs / (H - s);
    let DoF = Df - Dn;

    let result = {
      nearLimit: Dn / 1000.0, 
      farLimit: Df / 1000.0, 
      hyperFocal: H / 1000.0, 
      DoF: DoF / 1000.0,
      circleOfConfusion: CoC
    };

    if(!fullFrame)
      focalLength *= Number((43.27 / d).toPrecision(2)); // full frame diagonal = 43.27

    
    let fov = 2 * Math.atan(sw / (2 * focalLength)); // in rad
    this.dofVisualizer.updateCamera(fov);

    this.dofVisualizer.updateDoF(
      this.dataModel.aperture, 
      focalLength,
      this.dataModel.distance
    );
  }

  public selectVendor(evt:any) {    
    this.selectedModels = this.models[this.dataModel.vendor];    
  }

  public selectModel(evt:any) {
    this.calculateDof();
  }

}
