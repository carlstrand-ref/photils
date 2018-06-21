import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Utils } from '../utils';
import { ArSphereComponent } from '../ar-sphere/ar-sphere.component';
import {  Vector3 } from 'babylonjs';
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
    photo.image.subscribe( (dimension:{width: number, height: number}) => {
      let coords = Utils.latLonToXYZ(photo.lat, photo.long);      
      let pos = new BABYLON.Vector3(coords.x / 1000.0, coords.z / 1000.0, coords.y / 1000.0);

      let ratio = Math.max(dimension.width, dimension.height) / Math.min(dimension.width, dimension.height);
      let width = 1.0;
      let height = 1.0;

      if(dimension.width > dimension.height) {
        width *= ratio;
      } else {
        height *= ratio;
      }
            
      let plane = BABYLON.MeshBuilder.CreatePlane("wall_"+photo.title, {width: width, height: height}, this.arSphere.scene);            
      let d = BABYLON.Vector3.DistanceSquared(this.arSphere.scene.activeCamera.position, pos);          
      plane.position = pos;
      plane.scaling = new Vector3(d / 10.0, d / 10.0, d / 10.0);

      // move object to minDistance km if too close
      if (d <= this.minDistance) {
        let camPos:Vector3 = this.arSphere.scene.activeCamera.position;
        let dir = pos.subtract(camPos).normalize();        
        dir.multiply(new Vector3(this.minDistance, 0, this.minDistance));      
        plane.position.addInPlace(dir);                        
      }

      plane.lookAt(this.arSphere.scene.activeCamera.position);            

      let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);   
      let button = BABYLON.GUI.Button.CreateImageOnlyButton("button_" + photo.title, photo.imageUrl);   
      button.width = 1;
      button.height = 1;

      button.onPointerUpObservable.add(() => {                
        console.log("nu", plane.name, photo.title);
      });      

      imageTexture.addControl(button);
    });
  }

}
