import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Utils } from '../utils';
import { ArSphereComponent } from '../ar-sphere/ar-sphere.component';
import {  Vector3, Color3 } from 'babylonjs';
import { AdvancedDynamicTexture } from 'babylonjs-gui';
import {FlickrImageService, GeoImageService, GeoImage, IGeoImage} from '../geo-image-request';
import { HttpClient } from '@angular/common/http'; 
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-inspiration',
  templateUrl: './inspiration.component.html',
  styleUrls: ['./inspiration.component.scss']
})
export class InspirationComponent implements OnInit {
  @ViewChild(ArSphereComponent) arSphere: ArSphereComponent;
  private imageServices: GeoImageService[] = []; 
  private minDistance = 0.1; // in km
  private groupZones = 8; // device unit circel in N peaces to group images in zones

  constructor(private location: Location, private http: HttpClient) {
    let s = new FlickrImageService('686d968ee5fac542bb420630b04d9b87', http);    
    this.imageServices.push(s);
  }

  ngOnInit() {
    
  }

  private sphereReady() {
    console.log("ready!");    

    this.loadImages();    
  }

  private async loadImages() {
    let photos: IGeoImage[] = [];
    for(let service of this.imageServices) {      
      let p = await service.getImages(this.arSphere.geoLocation.lat, this.arSphere.geoLocation.long, 40);      
      photos = [...photos, ...p];
    }

    for(let photo of photos) {
      this.placePhoto(photo)
    }
  }


  private placePhoto(photo:IGeoImage) {
    // add image to scene if successful loaded
    let zones = [];
    let zoneRange = 360 / this.groupZones;
    let color = ["#b84c7d",
    "#69ab54",
    "#7f62b8",
    "#bca93d",
    "#b74a43",
    "#46c19a",
    "#c96934",
    "#937b35"]
    
    
    photo.image.subscribe( (dimension:{width: number, height: number}) => {
      let coords = Utils.latLonToXYZ(photo.lat, photo.long);      
      let pos = new BABYLON.Vector3(coords.x / 1000.0, coords.z / 1000.0, coords.y / 1000.0);
      let cam = this.arSphere.scene.activeCamera;
      let ratio = Math.max(dimension.width, dimension.height) / Math.min(dimension.width, dimension.height);
      let width = 1.0;
      let height = 1.0;

      if(dimension.width > dimension.height) {
        width *= ratio;
      } else {
        height *= ratio;
      }
            
      let plane = BABYLON.MeshBuilder.CreatePlane("wall_"+photo.title, {width: width, height: height}, this.arSphere.scene);            
      let d = BABYLON.Vector3.DistanceSquared(cam.position, pos);          
      plane.position = pos;
      plane.scaling = new Vector3(d / 10.0, d / 10.0, d / 10.0);

      // move object to minDistance km if too close
      if (d <= this.minDistance) {
        let camPos:Vector3 = cam.position;
        let dir = pos.subtract(camPos).normalize();        
        dir.multiply(new Vector3(this.minDistance, 0, this.minDistance));      
        plane.position.addInPlace(dir);                        
      }

      plane.lookAt(cam.position);            
      
      let v1 = cam.position.add(new Vector3(1,0,0));
      let v2 = pos.subtract(cam.position);
      
      let dot = v1.x * v2.x + v1.y * v2.y;
      let det = v1.x * v2.x - v1.y * v2.y

      let angle = Math.atan2(det, dot);
      let angleDeg = BABYLON.Tools.ToDegrees(angle);

      if(angleDeg < 0) angleDeg += 360;

      let z = undefined;
      for(let i = 0; i < this.groupZones; i++) {
        if(angleDeg >= i * zoneRange && angleDeg <= (i + 1) * zoneRange) {
          z = i;                                   
          break;
        }     
      }
    
      if(!(zones[z] instanceof Array))
        zones[z] = []

      zones[z].push(plane);
     
      let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);   
      let button = BABYLON.GUI.Button.CreateImageOnlyButton("button_" + photo.title, photo.imageUrl);   
      button.width = 1.0;
      button.height = 1.0;
      button.thickness = 10.0;      
      button.color = color[z];

      button.onPointerUpObservable.add(() => {                
        console.log("nu", plane.name, photo.title);
      });      

      imageTexture.addControl(button);
    });
  }

}
