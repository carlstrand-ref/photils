import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Utils } from '../utils';
import { ArSphereComponent } from '../ar-sphere/ar-sphere.component';
import {  Vector3, Color3, TransformNode, Mesh } from 'babylonjs';
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
  private maxImagesPerGroupd = 20; // it's not an image gallery app so limit the number of groups
  private zones = {};
  private zoneRange: number;
  private selectedImage = null;

  constructor(private http: HttpClient) {
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
      let plane:BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane("zone_"+i, {width: 0.2, height: 0.2}, this.arSphere.scene);            
      let pos:Vector3 = this.zones[i][0].position.subtract(cam.position);            
      pos.normalize().multiplyInPlace(new Vector3(1, 0, 1)).addInPlace(cam.position);      
      plane.position = pos;            
      plane.lookAt(cam.position);                     

      let items = Math.min(this.zones[i].length, this.maxImagesPerGroupd);
      let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);         
      let button = BABYLON.GUI.Button.CreateImageWithCenterTextButton( "button_zone_" + i, ""+items, 'assets/textures/aperture.png');         
      button.fontSize = 300;
      button.width = 1.0;
      button.height = 1.0;
      button.thickness = 0.0;         
      button.zIndex = 10;         
      button.color = "#9e449e";   
      button.alpha = 0.8   

      let placed = false;
      button.onPointerUpObservable.add(() => {                
        if(!placed) {
          this.placeImages(Number(i), pos);                    
        } else {
          this.removeImages(Number(i), pos);
        }

        placed = !placed;
      });      

      imageTexture.addControl(button);
    }
  }

  private removeImages(zone:number, position: BABYLON.Vector3) {    
    for(let child of this.arSphere.scene.getMeshesByTags('mesh_zone_' + zone)) {
      let xAnimation = BABYLON.Animation.CreateAnimation(
        'position.x', 
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        120, new BABYLON.QuadraticEase()
      );
  
      let yAnimation = BABYLON.Animation.CreateAnimation(
        'position.y', 
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        120, new BABYLON.QuadraticEase()
      );

      let xKeys = [{
          frame : 0,
          value : child.position.x
        }, {
          frame : 30,
          value : 0
        }];
      
      let yKeys = [{
          frame : 0,
          value : child.position.y
      }, {
          frame : 30,
          value : 0
      }];

      xAnimation.setKeys(xKeys);
      yAnimation.setKeys(yKeys);

      child.animations = [xAnimation, yAnimation];
      this.arSphere.scene.beginAnimation(child, 0, 60, false, 1.0, () => {        
        child.dispose();
      });
    }
  }

  private groupImage(photo:IGeoImage) {    
    let cam = this.arSphere.scene.activeCamera;               

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


  private placeImages(zone:number, position: BABYLON.Vector3) {
    let photos = this.zones[zone];    
    let cam = this.arSphere.scene.activeCamera;               
    let zoneButton = this.arSphere.scene.getMeshByName("zone_"+zone);
    let node = new BABYLON.TransformNode("zone_node_" + zone, this.arSphere.scene);
    node.position = position.clone();    
    node.lookAt(cam.position);    

    let maxImages = Math.min(photos.length, this.maxImagesPerGroupd);
    let step = Math.PI * 2 / maxImages;
    let p = 0;  
    let r = 0.3;  
    
    for (let i = 0; i < maxImages; i++) {
      let photo = photos[i];
      let x = r * Math.sin(p);
      let y = r * Math.cos(p);

      let plane = BABYLON.MeshBuilder.CreatePlane("image_zone_"+zone+"_"+photo.title, {width: 0.1, height: 0.1}, this.arSphere.scene);            
      plane.parent = node;      
      plane.position = new BABYLON.Vector3(0, 0, 0);  
      plane.visibility = 0;

      BABYLON.Tags.EnableFor(plane);
      (plane as any).addTags("mesh_zone_" + zone);
    
      let xAnimation = new BABYLON.Animation("plane_x"+ photo.title, "position.x", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      let yAnimation = new BABYLON.Animation("plane_y"+ photo.title, "position.y", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      
      let xKeys = [{
          frame : 0,
          value : 0
      }, {
          frame : 30,
          value : x
      }];
      
      let yKeys = [{
        frame : 0,
        value : 0
      }, {
          frame : 30,
          value : y
      }];

      xAnimation.setKeys(xKeys);
      yAnimation.setKeys(yKeys);

      let easeFnc = new BABYLON.QuadraticEase();
      xAnimation.setEasingFunction(easeFnc);
      yAnimation.setEasingFunction(easeFnc);      
      plane.animations = [xAnimation, yAnimation];        

      photo.image.subscribe( (img:{objUrl: string, width: number, height: number}) => {      
        let ratio = Math.max(img.width, img.height) / Math.min(img.width, img.height);
        let width = 1.0;
        let height = 1.0;

        if(img.width >= img.height) width *= ratio;
        else height *= ratio;

        console.log(width, height, photo.title, img.width, img.height);

        plane.scaling = new BABYLON.Vector3(width, height, 1);
        let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);   
        let button = BABYLON.GUI.Button.CreateImageOnlyButton("button_" + photo.title, img.objUrl);   
        button.width = 1.0;
        button.height = 1.0;     
        button.thickness = 0.0;    
        button.zIndex = 100;    

        button.onPointerUpObservable.add(() => {                    
          if(this.selectedImage !== null)  {          
            this.deselectImage();
          }

          if(this.selectedImage !== null && this.selectedImage.image === plane) {
            this.selectedImage = null;
            zoneButton.setEnabled(true);
            this.imageDetailsUI(false);
            return;   
          }
            
          
          this.selectedImage = {};
          this.selectedImage.srcPos = plane.position.clone();

          this.selectImage(plane, photo);
          this.selectedImage.image = plane;  
          this.selectedImage.photo = photo;
          zoneButton.setEnabled(false);
          
        });      

        imageTexture.addControl(button);
        
        plane.visibility = 1;        
        this.arSphere.scene.beginAnimation(plane, 0, 60, false);

      });

      p += step;
    }    
  }

  deselectImage() {
    let xScaleAnimation = new BABYLON.Animation("plane-scale-x", "scaling.x", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let yScaleAnimation = new BABYLON.Animation("plane-scale-y", "scaling.y", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let xAnimation = new BABYLON.Animation("plane-x", "position.x", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let yAnimation = new BABYLON.Animation("plane-y", "position.y", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    
    let xKeys = [{
      frame : 0,
      value : 0
    },{
        frame : 30,
        value : this.selectedImage.srcPos.x
    }];

    let yKeys = [{
      frame : 0,
      value : 0
    },{
        frame : 30,
        value : this.selectedImage.srcPos.y
    }];

    let xScaleKeys = [{
      frame : 0,
      value : this.selectedImage.image.scaling.x
    },{
        frame : 30,
        value : this.selectedImage.image.scaling.x / 2.5
    }];

    let yScaleKeys = [{
      frame : 0,
      value : this.selectedImage.image.scaling.y
    },{
        frame : 30,
        value : this.selectedImage.image.scaling.y / 2.5
    }];

    xAnimation.setKeys(xKeys);
    yAnimation.setKeys(yKeys);
    xScaleAnimation.setKeys(xScaleKeys);
    yScaleAnimation.setKeys(yScaleKeys);
    
    this.selectedImage.image.animations = [xAnimation, yAnimation, xScaleAnimation, yScaleAnimation];            
    this.arSphere.scene.beginAnimation(this.selectedImage.image, 0, 60, false);              
  }

  selectImage(plane: BABYLON.Mesh, photo:IGeoImage) {
    let xAnimation = new BABYLON.Animation("plane-x"+ photo.title, "position.x", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let yAnimation = new BABYLON.Animation("plane-y"+ photo.title, "position.y", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let xScaleAnimation = new BABYLON.Animation("plane-scale-x"+ photo.title, "scaling.x", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let yScaleAnimation = new BABYLON.Animation("plane-scale-y"+ photo.title, "scaling.y", 120, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    
    let xKeys = [{
      frame : 0,
      value : plane.position.x
    },{
        frame : 30,
        value : 0
    }];
    
    let yKeys = [{
      frame : 0,
      value : plane.position.y
    },{
        frame : 30,
        value : 0
    }];

    let xScaleKeys = [{
      frame : 0,
      value : 1
    },{
        frame : 30,
        value : 2.5 * plane.scaling.x
    }];

    let yScaleKeys = [{
      frame : 0,
      value : 1
    },{
        frame : 30,
        value : 2.5 * plane.scaling.y
    }];

    xAnimation.setKeys(xKeys);
    yAnimation.setKeys(yKeys);

    xScaleAnimation.setKeys(xScaleKeys);
    yScaleAnimation.setKeys(yScaleKeys);

    plane.animations = [xAnimation, yAnimation, xScaleAnimation, yScaleAnimation]; 

    for(let a of plane.animations)
      a.setEasingFunction(new BABYLON.QuadraticEase());
    
    this.arSphere.scene.beginAnimation(plane, 0, 60, false);
  }

  private imageDetailsUI(show:boolean = true, image?:IGeoImage) {
    
  }

  private initImageDetailsUI() {
    let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    let panel = new BABYLON.GUI.StackPanel("stackpanel");
    panel.isVertical = false;
    panel.height = "70px";
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(panel);

    let btnRoute = BABYLON.GUI.Button.CreateSimpleButton("btnRoute", "Route");
    btnRoute.width = 0.4;
    btnRoute.height = "40px";      
    btnRoute.color = "white";
    btnRoute.cornerRadius = 0;
    btnRoute.background = "green";
    btnRoute.thickness = 0.1;
    btnRoute.onPointerUpObservable.add(function() {
        alert("you did it!");
    });

    let btnView = BABYLON.GUI.Button.CreateSimpleButton("btnView", "View on Website");
    btnView.width = 0.4;
    btnView.height = "40px";
    btnView.color = "white";
    btnView.cornerRadius = 0;
    btnView.thickness = 0.1;
    btnView.background = "green";
    btnView.onPointerUpObservable.add(function() {
        alert("you did it!");
    });

    panel.addControl(btnRoute);
    panel.addControl(btnView);

    BABYLON.Tags.EnableFor(advancedTexture);
    (advancedTexture as any).addTags("details_ui");

    panel.isVisible = false;
  }

  private openRoute() {
    let img = this.selectedImage.photo as IGeoImage;
    let origin = this.arSphere.geoLocation;
    let url = "https://www.google.com/maps/dir/?api=1" + 
              "&origin=" + origin.lat + "," + origin.long +
              "&destination=" + img.lat + "," + img.long;
    window.open(url, "_blank");
  }

  private openWebsite() {
    let img = this.selectedImage.photo as IGeoImage;
    window.open(img.detailsUrl, "_blank");
  }
}
