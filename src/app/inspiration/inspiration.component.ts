import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
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
  private groupZones = 12; // device unit circel in N peaces to group images in zones
  private zones = {};
  private zoneRange: number;

  constructor(private location: Location, private http: HttpClient) {
    this.zoneRange = 360 / this.groupZones;
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
      this.groupImage(photo)
    }

    this.placeGroups();

  }

  private placeGroups() {
    let cam = this.arSphere.scene.activeCamera;    

    for(let i in this.zones) {
      console.log("zone " + i + " with " + this.zones[i].length + " items");
      let plane:BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane("zone_"+i, {width: 0.25, height: 0.25}, this.arSphere.scene);            
      let pos:Vector3 = this.zones[i][0].position.subtract(cam.position);            
      pos.normalize().multiplyInPlace(new Vector3(1, 0, 1)).addInPlace(cam.position);      
      plane.position = pos;            
      plane.lookAt(cam.position);               

      let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);         
      let button = BABYLON.GUI.Button.CreateImageWithCenterTextButton( "button_zone_" + i, ""+this.zones[i].length, 'assets/textures/aperture.png');         
      button.fontSize = 300;
      button.width = 1.0;
      button.height = 1.0;
      button.thickness = 0.0;         
      button.zIndex = 1000;         
      button.color = "#9e449e";   
      button.alpha = 0.8   

      button.onPointerUpObservable.add(() => {                
        console.log("nu", plane.name);
        this.placeInGrid(Number(i));
      });      

      imageTexture.addControl(button);
    }
  }

  private groupImage(photo:IGeoImage) {    
    let cam = this.arSphere.scene.activeCamera;       
    let d = BABYLON.Vector3.DistanceSquared(cam.position, photo.position);          
    // move object to minDistance km if too close
    if (d <= this.minDistance) {      
      let dir = photo.position.subtract(cam.position).normalize();        
      dir.multiplyInPlace(new Vector3(this.minDistance, 0, this.minDistance));     
      photo.position.addInPlace(dir);                        
    }

    let v1 = cam.position.add(new Vector3(1,0,0));
    let v2 = photo.position.subtract(cam.position);
    
    let dot = v1.x * v2.x + v1.y * v2.y;
    let det = v1.x * v2.x - v1.y * v2.y

    let angle = Math.atan2(det, dot);
    let angleDeg = BABYLON.Tools.ToDegrees(angle);

    if(angleDeg < 0) angleDeg += 360;

    let z = undefined;
    for(let i = 0; i < this.groupZones; i++) {
      if(angleDeg >= i * this.zoneRange && angleDeg <= (i + 1) * this.zoneRange) {
        z = i;                                   
        break;
      }     
    }
  
    if(!(this.zones[z] instanceof Array))
      this.zones[z] = []

    this.zones[z].push(photo);
  }


  private placeInGrid(zone:number) {
    let photos = this.zones[zone];
    console.log(photos);
    //photo.image.subscribe( (dimension:{width: number, height: number}) => {      
      //let width = 1.0;
      //let height = 1.0;
      // let ratio = Math.max(dimension.width, dimension.height) / Math.min(dimension.width, dimension.height);
      // if(dimension.width > dimension.height) {
      //   width *= ratio;
      // } else {
      //   height *= ratio;
      // }
            
      // let plane = BABYLON.MeshBuilder.CreatePlane("wall_"+photo.title, {width: width, height: height}, this.arSphere.scene);            
      // plane.position = pos;
      // plane.scaling = new Vector3(d / 10.0, d / 10.0, d / 10.0);    

      // plane.lookAt(cam.position);            
      
      
      
      // let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);   
      // let button = BABYLON.GUI.Button.CreateImageOnlyButton("button_" + photo.title, photo.imageUrl);   
      // button.width = 1.0;
      // button.height = 1.0;
      // button.thickness = 10.0;      

      // button.onPointerUpObservable.add(() => {                
      //   console.log("nu", plane.name, photo.title);
      // });      

      // imageTexture.addControl(button);
    //});
  }
}
