import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Utils } from '../utils';
import { ArSphereComponent } from '../ar-sphere/ar-sphere.component';

@Component({
  selector: 'app-inspiration',
  templateUrl: './inspiration.component.html',
  styleUrls: ['./inspiration.component.scss']
})
export class InspirationComponent implements OnInit {
  @ViewChild(ArSphereComponent) arSphere: ArSphereComponent;

  private dummyData :{ lat: number, lon: number, altitude: number, title: string }[] = [
    { lat: 51.98364221, lon: 9.81239562, altitude: 94, title:'Fargus Grecon' },
    { lat: 52.003723, lon: 9.834583, altitude: 320.0, title:'Himmelbergturm' },
    { lat: 51.99344372, lon: 9.81900254, altitude: 92, title:'MM Packaging' },
    { lat: 51.994069, lon: 9.823915, altitude: 100, title:'Mozardstraße' },
  ]

  constructor(private location: Location) { }

  ngOnInit() {
    
  }

  private sphereReady() {
    console.log("ready!");
    this.placeLocations(this.dummyData);
  }

  private placeLocations(locations : { lat: number, lon: number, altitude: number, title: string }[]) {
    for( const location of locations ) {
      let coords = Utils.latLonToXYZ(location['lat'], location['lon']);      
      let pos = new BABYLON.Vector3(coords.x / 1000.0, location.altitude / 1000.0, coords.y / 1000.0);
            
      let box = BABYLON.MeshBuilder.CreatePlane("wall", {width: 0.25, height: 0.125}, this.arSphere.scene);            
      box.position = pos;
      box.lookAt(this.arSphere.scene.activeCamera.position);            

      let font = "bold 44px monospace";
      let dynTexture =  new BABYLON.DynamicTexture(location.title, {width:512, height:256}, this.arSphere.scene);
      dynTexture.drawText(location.title, 75, 135, font, "green", "white", true, true);

      let boxMaterial = new BABYLON.StandardMaterial("material", this.arSphere.scene);
      boxMaterial.emissiveColor = new BABYLON.Color3(0.58, 0, 0.86);
      boxMaterial.diffuseTexture = dynTexture;
      boxMaterial.backFaceCulling = true;
      box.material = boxMaterial;

      console.log(BABYLON.Vector3.DistanceSquared(this.arSphere.scene.activeCamera.position, pos));
    }
  }

}
