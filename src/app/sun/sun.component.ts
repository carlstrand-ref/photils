import { Component, OnInit } from '@angular/core';
import { OSMProvider } from '../osm/osm';

@Component({
  selector: 'app-sun',
  templateUrl: './sun.component.html',
  styleUrls: ['./sun.component.scss']
})
export class SunComponent implements OnInit {
  private map: OSMProvider;
  private element: string = 'leaflet-map-container';

  constructor() {
    this.map = new OSMProvider();
  }

  public async ngOnInit() {
    await this.map.initialize(this.element, true);
  }
}
