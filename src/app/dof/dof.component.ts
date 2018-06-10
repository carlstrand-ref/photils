import { Component, OnInit, AfterContentChecked, AfterContentInit, AfterViewInit } from '@angular/core';
import json from '../../assets/camera-sensor-data.json';
import { AppServics } from '../app-service.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-dof',
  templateUrl: './dof.component.html',
  styleUrls: ['./dof.component.css']
})
export class DofComponent implements AfterViewInit {
  private data: any = <any> json;
  public vendors: Set<String> = new Set<String>();
  public selectedModels:Array<any> = new Array<any>();
  public models: {} = {};
  public dataModel = {vendor: '', model: '', aperture: 2.8, focalLength: 55, distance: 10};
  public apertures = [];
  public metricSystem:boolean = true;

  constructor(private appService: AppServics, private appComponent: AppComponent) {
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
    let s = this.dataModel.distance * 1000; // convert m to mm
    let H = this.dataModel.focalLength + (this.dataModel.focalLength ** 2) / (this.dataModel.aperture * CoC); // Hyperfocal in mm
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

    console.log(result);
  }

  public selectVendor(evt:any) {    
    this.selectedModels = this.models[this.dataModel.vendor];    
  }

  public selectModel(evt:any) {
    this.calculateDof();
  }

  ngAfterViewInit() {
    this.appComponent.setTitle("Depth of Field Calculator");
  }

}
