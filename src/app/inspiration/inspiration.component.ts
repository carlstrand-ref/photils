import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Utils } from '../utils';
import { ArSphereComponent } from '../ar-sphere/ar-sphere.component';
import {  Vector3, TransformNode, MeshBuilder } from 'babylonjs';
import { AdvancedDynamicTexture } from 'babylonjs-gui';
import {FlickrImageService, GeoImageService, GeoImage, IGeoImage} from '../geo-image-request';
import { HttpClient } from '@angular/common/http'; 
import { PageEvent } from '@angular/material';

@Component({
  selector: 'app-inspiration',
  templateUrl: './inspiration.component.html',
  styleUrls: ['./inspiration.component.scss']
})
export class InspirationComponent implements OnInit {
  @ViewChild(ArSphereComponent) arSphere: ArSphereComponent;
  private imageServices: GeoImageService[] = []; 
  private minDistance = 0.1; // in km
  private loading:boolean = false;
  private groupZones = 8; // device unit circel in N peaces to group images in zones
  private maxImagesPerGroupd = 20; // it's not an image gallery app so limit the number of groups
  private zones = {};
  private zoneRange: number;
  private selectedImage = null;
  private displaySettings = false;
  private radius = 5;
  private usedSceneObjects = [];
  private paginator: {page: number, pages: number, total: number, numItemsPerPages:number };

  constructor(private http: HttpClient) {
    this.zoneRange = 360 / this.groupZones;
    let s = new FlickrImageService('686d968ee5fac542bb420630b04d9b87', http);    
    this.imageServices.push(s);
  }

  ngOnInit() {
    
  }

  private sphereReady() {
    console.log("ready!");    
    this.debugZones();
    this.loadImages();    
  }

  private clearScene() {
    //this.arSphere.reset();        
    for(let o of this.usedSceneObjects) {
      o.dispose();
    }    
  }

  private applyFilter() {            
    this.zones = {};
    this.clearScene();    
    this.loadImages();
    this.displaySettings = false;
  }

  private async loadImages() {
    let page = this.paginator === undefined ? 1 : this.paginator.page;
    this.loading = true;
    let photos: IGeoImage[] = [];
    for(let service of this.imageServices) {      
      let p = await service.getImages(this.arSphere.geoLocation.lat, this.arSphere.geoLocation.lon, this.radius, page);      
      photos = [...photos, ...p];
    }

    for(let photo of photos) {      
      this.groupImage(photo)
    }

    this.placeGroups();

    // hacky needs to be more generic
    let s = this.imageServices[0] as FlickrImageService;
    this.paginator = {
      page: s.getCurrentPage(),
      pages: s.getNumPages(),
      total: s.getTotal(),
      numItemsPerPages: s.getItemsPerPage()
    }
    console.log(this.paginator);
    this.loading = false;
  }

  private placeGroups() {
    let cam = this.arSphere.scene.activeCamera;        
    let startPoint = cam.position.clone();
    let v1 = Vector3.Left();
    let half = this.zoneRange / 2.0;

    v1.normalize().multiplyInPlace(new Vector3(1.3, 0, 1.3)); 
    

    for(let i in this.zones) {                                
      let deg = this.zoneRange * Number(i) + half;            
      let rad = BABYLON.Tools.ToRadians(deg);
      let mat = BABYLON.Matrix.RotationY(rad);  
      let pos = BABYLON.Vector3.TransformCoordinates(v1, mat);          
      pos = startPoint.add(pos);
      
      //let pos = BABYLON.Vector3.TransformCoordinates(v2, mat).add(v1);                        

      let plane:BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane("zone_"+i, {width: 0.2, height: 0.2}, this.arSphere.scene);                  
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
      
      this.usedSceneObjects.push(plane, button, imageTexture);
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

    // let v1:Vector3 = cam.position.add(Vector3.Left());
    // v1.normalize().multiplyInPlace(new Vector3(1, 0, 1));   

    // let v2:Vector3 = photo.position.subtract(cam.position);
    // v2.normalize().multiplyInPlace(new Vector3(1, 0, 1));           
    
    // let dot = Vector3.Dot(v1, v2);    
    // let angle = dot / (v1.length() * v2.length());  
    // let angleDeg = BABYLON.Tools.ToDegrees(angle);    

    let angleDeg = Utils.angleFromCoords(
      this.arSphere.geoLocation.lat, this.arSphere.geoLocation.lon,
      photo.lat, photo.long
    )

    //console.log(photo.equirectengularCoordinates(this.radius, this.arSphere.geoLocation))
        
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

  private debugZones() {
    let cam = this.arSphere.scene.activeCamera;                       
    let startPoint = cam.position.clone();
    let v1 = Vector3.Left();
    
    startPoint.y -= 0.5;        
    v1.normalize().multiplyInPlace(new Vector3(4, 0, 4)); 
     

    for(let i = 0; i < this.groupZones; i++) { 
      let deg = i * this.zoneRange;            
      let rad = BABYLON.Tools.ToRadians(deg);
      let mat = BABYLON.Matrix.RotationY(rad);  
      let rv = BABYLON.Vector3.TransformCoordinates(v1, mat);      
      rv.addInPlace(startPoint);    
      rv.y = cam.position.y;
      
      let c = Utils.hueToColor3(i * this.zoneRange, 1.0, 1.0).toColor4();
      let options = {
        points: [startPoint, rv],
        colors: [c, c]        
      };      
      let line = BABYLON.MeshBuilder.CreateLines("lines", options, this.arSphere.scene);
      //this.usedSceneObjects.push(line);
    }    
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
    let r = 0.35;  

    this.usedSceneObjects.push(node);
    
    for (let i = 0; i < maxImages; i++) {
      let photo = photos[i];
      let x = r * Math.sin(p);
      let y = r * Math.cos(p);

      let plane = BABYLON.MeshBuilder.CreatePlane("image_zone_"+zone+"_"+photo.id, {width: 0.1, height: 0.1}, this.arSphere.scene);            
      plane.parent = node;      
      plane.position = new BABYLON.Vector3(0, 0, 0);  
      plane.visibility = 0;

      BABYLON.Tags.EnableFor(plane);
      (plane as any).addTags("mesh_zone_" + zone);
      
    
      let xAnimation = new BABYLON.Animation("plane_x"+ photo.title, "position.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      let yAnimation = new BABYLON.Animation("plane_y"+ photo.title, "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      
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

      let easeFnc = new BABYLON.ElasticEase(2, 3);
      easeFnc.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

      xAnimation.setEasingFunction(easeFnc);
      yAnimation.setEasingFunction(easeFnc);      
      plane.animations = [xAnimation, yAnimation];        

      photo.image.subscribe( (img:{objUrl: string, width: number, height: number}) => {      
        let ratio = Math.max(img.width, img.height) / Math.min(img.width, img.height);
        let width = 1.0;
        let height = 1.0;

        if(img.width >= img.height) width *= ratio;
        else height *= ratio;        

        plane.scaling = new BABYLON.Vector3(width, height, 1);
        let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);   
        let button = BABYLON.GUI.Button.CreateImageOnlyButton("button_" + photo.id, img.objUrl);   
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
        this.arSphere.scene.beginAnimation(plane, 0, 30, false);
        this.usedSceneObjects.push(imageTexture, button);
      });

      this.usedSceneObjects.push(plane);
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
  private changePage(e:PageEvent) {
    console.log("change: " , e);
    this.paginator.page = e.pageIndex + 1;
    this.applyFilter();
  }

  private openRoute() {
    let img = this.selectedImage.photo as IGeoImage;
    let origin = this.arSphere.geoLocation;
    let url = "https://www.google.com/maps/dir/?api=1" + 
              "&origin=" + origin.lat + "," + origin.lon +
              "&destination=" + img.lat + "," + img.long;
    window.open(url, "_blank");
  }

  private openWebsite() {
    let img = this.selectedImage.photo as IGeoImage;
    window.open(img.detailsUrl, "_blank");
  }
}
