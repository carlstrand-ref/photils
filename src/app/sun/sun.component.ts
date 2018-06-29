import { Component, OnInit } from '@angular/core';
import * as Leaflet from 'leaflet';

declare const navigator: any;

@Component({
  selector: 'app-sun',
  templateUrl: './sun.component.html',
  styleUrls: ['./sun.component.scss']
})
export class SunComponent implements OnInit {
  private static MAP_ELEMENT_ID: string = 'leaflet-map-container';
  private static OTS_TILE_API: string = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  
  private map: Leaflet.Map;
  private highAccuracy: boolean = true;
  private zoomLevel: number = 16;

  public async ngOnInit() {
    const layer: Leaflet.GridLayer = Leaflet.tileLayer(SunComponent.OTS_TILE_API, {});
    const devicePosition: any = await this.getDevicePosition({
      enableHighAccuracy: this.highAccuracy
    });

    this.map = Leaflet.map(SunComponent.MAP_ELEMENT_ID);
    this.map.setView([devicePosition.coords.latitude, devicePosition.coords.longitude], this.zoomLevel);

    layer.addTo(this.map);
  }

  private getDevicePosition(options?: PositionOptions): Promise<any> {
    if(navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    }
  }

}
