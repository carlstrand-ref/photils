import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppDataServics } from '../app-data.service';
import { LocalStorage } from 'ngx-store';
import { MatOptionSelectionChange } from '../../../node_modules/@angular/material';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  @LocalStorage() public legacy: boolean = false;
  @LocalStorage() cachedSelection:any = { vendor: '',  model: ''}

  public dataModel = {vendor: '', model: ''};
  public selectedModels:Array<any> = [];

  constructor(public appDataService: AppDataServics) { }

  ngOnInit() {
    if(this.cachedSelection.vendor !== "" && this.cachedSelection.model !== "") {
      this.dataModel.vendor = this.cachedSelection.vendor;
      this.selectedModels = this.appDataService.getModels(this.dataModel.vendor);

      let idx;
      for(let i in this.selectedModels) {
        if(this.selectedModels[i].CameraModel === this.cachedSelection.model) {
          idx = i;
          break;
        }
      }
      this.dataModel.model = this.selectedModels[idx];
    }
  }

  ngOnDestroy() {}

  public selectVendor(evt:any) {
    this.selectedModels = this.appDataService.getModels(this.dataModel.vendor);
  }

  public selectModel(evt:any) {
    console.log("whaaat");
    this.cachedSelection.vendor = this.dataModel.vendor;
    this.cachedSelection.model = (this.dataModel.model as any).CameraModel;
    this.cachedSelection.save();
  }

  public changeLegacy(e:MatOptionSelectionChange) {
    this.legacy = e.source.value === 'true' ? true : false;
  }

}
