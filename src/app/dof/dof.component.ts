import { Component, OnInit } from '@angular/core';
import json from '../../assets/camera-sensor-data.json';


@Component({
  selector: 'app-dof',
  templateUrl: './dof.component.html',
  styleUrls: ['./dof.component.css']
})
export class DofComponent implements OnInit {
  private data: any = <any> json;
  public vendors: Set<String> = new Set<String>();
  public selectedModels: Array<any> = new Array<any>();
  public models: {} = {};
  public dataModel = {vendor: ''};

  constructor() {
    for(const camera of this.data) {
      this.vendors.add(camera.CameraMaker);

      if (!(this.models[camera.CameraMaker] instanceof Array)){
        this.models[camera.CameraMaker] = [];
      }

      this.models[camera.CameraMaker].push(camera.CameraModel);
    }
  }

  public selectVendor(evt:any){
    this.selectedModels = this.models[this.dataModel.vendor];
    console.log(this.selectedModels);
  }

  ngOnInit() {
    
  }

}
