import { Component, OnInit, ViewChild, isDevMode } from '@angular/core';
import { Utils } from '../utils';
import { ArSphereComponent } from '../ar-sphere/ar-sphere.component';
import {  Vector3, TransformNode, MeshBuilder, FreeCamera } from 'babylonjs';
import { AdvancedDynamicTexture } from 'babylonjs-gui';
import {FlickrImageService, GeoImageService, GeoImage, IGeoImage} from '../geo-image-request';
import { HttpClient } from '@angular/common/http';
import { PageEvent } from '@angular/material';
import {MatSnackBar} from '@angular/material';


@Component({
  selector: 'app-inspiration',
  templateUrl: './inspiration.component.html',
  styleUrls: ['./inspiration.component.scss']
})
export class InspirationComponent implements OnInit {
  @ViewChild(ArSphereComponent) arSphere: ArSphereComponent;
  public loading:boolean = false;
  public selectedImage = null;
  public displaySettings = false;
  public radius = 5;
  public paginator: {page: number, pages: number, total: number, numItemsPerPages:number };

  private imageServices: Array<GeoImageService> = [];
  private minDistance = 0.1; // in km
  private groupZones = 12; // device unit circel in N peaces to group images in zones
  private maxImagesPerGroupd = 20; // it's not an image gallery app so limit the number of groups
  private zones = {};
  private zoneRange: number;
  private usedSceneObjects = [];
  private groupPlane:BABYLON.Mesh;
  private imagePlane:BABYLON.Mesh;
  private worldNode:BABYLON.TransformNode;

  constructor(private http: HttpClient, public snackBar: MatSnackBar) {
    this.zoneRange = 360 / this.groupZones;
    let s = new FlickrImageService('686d968ee5fac542bb420630b04d9b87', http);
    this.imageServices.push(s);
  }

  ngOnInit() {

  }

  public sphereReady() {
    console.log("ready!");
    this.worldNode = new BABYLON.TransformNode("root", this.arSphere.scene);
    this.groupPlane = BABYLON.MeshBuilder.CreatePlane("zone", {width: 0.2, height: 0.2}, this.arSphere.scene);
    this.imagePlane = BABYLON.MeshBuilder.CreatePlane("image_zone_", {width: 0.1, height: 0.1}, this.arSphere.scene);
    this.loadImages();

    let finalAngle = 360 - this.arSphere.orientationResult.alpha + BABYLON.Tools.ToDegrees(this.arSphere.cameraOffset.y);
    this.worldNode.rotation.y = BABYLON.Tools.ToRadians(finalAngle);
  }

  private clearScene() {
    //this.arSphere.reset();
    for(let o of this.usedSceneObjects) {
      o.dispose();
    }

  }

  public applyFilter() {
    this.zones = {};
    this.clearScene();
    this.loadImages();
    this.displaySettings = false;
  }

  private async loadImages() {
    let page = this.paginator === undefined ? 1 : this.paginator.page;
    this.loading = true;
    let photos: Array<IGeoImage> = [];
    let error:Error = undefined;
    for(let service of this.imageServices) {
      try {
        let p = await service.getImages(this.arSphere.geoLocation.lat, this.arSphere.geoLocation.lon, this.radius, page);
        photos = [...photos, ...p];
      } catch(e) { error = e };
    }

    // if we have images and an error ignore it otherwise not
    if(photos.length === 0 && error) {
      this.snackBar.open("We got an error: " + error.message, 'Damn!', {
        duration: 10000, panelClass: 'error'
      });
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

    //this.debugZones();

    this.loading = false;
  }

  private placeGroups() {
    let cam = this.arSphere.scene.activeCamera;
    let startPoint = cam.position.clone();
    let v1 = Vector3.Forward();
    let half = this.zoneRange / 2.0;

    v1.normalize().multiplyInPlace(new Vector3(1.3, 0, 1.3));

    for(let i in this.zones) {
      let deg = this.zoneRange * Number(i) + half;
      let rad = BABYLON.Tools.ToRadians(deg);
      let mat = BABYLON.Matrix.RotationY(rad);
      let pos = BABYLON.Vector3.TransformCoordinates(v1, mat);
      pos = startPoint.add(pos);

      //let pos = BABYLON.Vector3.TransformCoordinates(v2, mat).add(v1);
      let plane = this.groupPlane.clone("zone_"+i);

      plane.position = pos;
      plane.lookAt(cam.position);
      plane.parent = this.worldNode;

      let items = Math.min(this.zones[i].length, this.maxImagesPerGroupd);
      let imageTexture = AdvancedDynamicTexture.CreateForMesh(plane);
      let button = BABYLON.GUI.Button.CreateImageWithCenterTextButton( "button_zone_" + i, ""+items, 'assets/textures/aperture.png');
      button.fontSize = 300;
      button.width = 1.0;
      button.height = 1.0;
      button.thickness = 0.0;
      button.zIndex = 10;
      button.color = "#9e449e";
      button.alpha = 0.8;

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
      let posAnimation = BABYLON.Animation.CreateAnimation(
        'position',
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        120, new BABYLON.QuadraticEase()
      );

      let posKeys = [{
          frame : 0,
          value : child.position
        }, {
          frame : 30,
          value : Vector3.Zero()
        }];

      posAnimation.setKeys(posKeys);

      child.animations = [posAnimation];
      this.arSphere.scene.beginAnimation(child, 0, 60, false, 1.0, () => {
        child.dispose();
      });
    }
  }

  private groupImage(photo:IGeoImage) {
    // let cam = this.arSphere.scene.activeCamera;
    // let pos = Utils.latLonToXYZ(this.arSphere.geoLocation.lat, this.arSphere.geoLocation.lon);
    // let v1:Vector3 = Vector3.Forward();
    // let v2:Vector3 = photo.position.subtract(pos);
    // v2.normalize().multiplyInPlace(new Vector3(1, 1, 1));

    // console.log(Utils.angleBetweenVector3(v1, v2));
    //if(angleDeg < 0) angleDeg += 360;

    let angleDeg = Utils.angleFromCoords(
      this.arSphere.geoLocation.lat, this.arSphere.geoLocation.lon,
      photo.lat, photo.long
    )

    // console.log(angleDeg + "==" + bla, Vector3.DistanceSquared(v1, v2));


    let z = undefined;
    for(let i = 0; i < this.groupZones; i++) {
      if(angleDeg >= i * this.zoneRange && angleDeg <= (i + 1) * this.zoneRange) {
        z = i;
        break;
      }
    }

    if(!(this.zones[z] instanceof Array))
      this.zones[z] = [];

    this.zones[z].push(photo);
  }

  private debugZones() {
    let cam = this.arSphere.scene.activeCamera;
    let startPoint = cam.position.clone();
    let v1 = Vector3.Forward();

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
      line.parent = this.worldNode;
      this.usedSceneObjects.push(line);
    }
  }

  private placeImages(zone:number, position: BABYLON.Vector3) {
    let photos = this.zones[zone];
    let cam = this.arSphere.scene.activeCamera;
    let zoneButton = this.arSphere.scene.getMeshByName("zone_"+zone);
    let node = new BABYLON.TransformNode("zone_node_" + zone, this.arSphere.scene);
    node.position = position.clone();
    node.lookAt(cam.position);
    node.parent = this.worldNode;

    let maxImages = Math.min(photos.length, this.maxImagesPerGroupd);
    let step = Math.PI * 2 / maxImages;
    let p = 0;
    let r = 0.35;

    this.usedSceneObjects.push(node);


    for (let i = 0; i < maxImages; i++) {
      let photo = photos[i];
      let x = r * Math.sin(p);
      let y = r * Math.cos(p);

      let plane = this.imagePlane.clone("image_plane"+zone+"_"+photo.id);
      plane.parent = node;
      plane.position = new BABYLON.Vector3(0, 0, 0);
      plane.visibility = 0;

      BABYLON.Tags.EnableFor(plane);
      (plane as any).addTags("mesh_zone_" + zone);

      let target = new Vector3(x, y, 0);
      let animation = new BABYLON.Animation("plane_position"+ photo.title, "position", 120, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      let positionKeys = [{
          frame : 0,
          value :  plane.position
      }, {
          frame : 60,
          value : target
      }];

      animation.setKeys(positionKeys);

      let easeFnc = new BABYLON.ElasticEase(2, 3);
      easeFnc.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
      animation.setEasingFunction(easeFnc);

      plane.animations = [animation];

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
        this.arSphere.scene.beginAnimation(plane, 0, 60, false);
        this.usedSceneObjects.push(imageTexture, button);
      });

      this.usedSceneObjects.push(plane);
      p += step;
    }
  }

  deselectImage() {
    let scaleAnimation = new BABYLON.Animation("plane-scale", "scaling", 120, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let posAnimation = new BABYLON.Animation("plane-x", "position", 120, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    let posKeys = [{
      frame : 0,
      value : Vector3.Zero()
    },{
        frame : 30,
        value : new Vector3(this.selectedImage.srcPos.x, this.selectedImage.srcPos.y, this.selectedImage.srcPos.z)
    }];

    let scaleKeys = [{
      frame : 0,
      value : this.selectedImage.image.scaling
    },{
        frame : 60,
        value : this.selectedImage.image.scaling.divide(new Vector3( 2.5,  2.5, 1))
    }];

    posAnimation.setKeys(posKeys);
    scaleAnimation.setKeys(scaleKeys);

    this.selectedImage.image.animations = [posAnimation, scaleAnimation];
    this.arSphere.scene.beginAnimation(this.selectedImage.image, 0, 60, false);
  }

  selectImage(plane: BABYLON.Mesh, photo:IGeoImage) {
    let posAnimation = new BABYLON.Animation("plane_pos"+ photo.title, "position", 120, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let scaleAnimation = new BABYLON.Animation("plane_scale"+ photo.title, "scaling", 120, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    let posKeys = [{
      frame : 0,
      value : plane.position
    },{
        frame : 30,
        value : Vector3.Zero()
    }];

    let scaleKeys = [{
      frame : 0,
      value : Vector3.One()
    },{
        frame : 30,
        value :plane.scaling.multiply(new Vector3( 2.5, 2.5, 1))
    }];

    posAnimation.setKeys(posKeys);
    scaleAnimation.setKeys(scaleKeys);
    plane.animations = [posAnimation, scaleAnimation];

    for(let a of plane.animations)
      a.setEasingFunction(new BABYLON.QuadraticEase());

    this.arSphere.scene.beginAnimation(plane, 0, 60, false);
  }

  public changePage(e:PageEvent) {
    console.log("change: " , e);
    this.paginator.page = e.pageIndex + 1;
    this.applyFilter();
  }

  public openRoute() {
    let img = this.selectedImage.photo as IGeoImage;
    let origin = this.arSphere.geoLocation;
    let url = "https://www.google.com/maps/dir/?api=1" +
              "&origin=" + origin.lat + "," + origin.lon +
              "&destination=" + img.lat + "," + img.long;
    window.open(url, "_blank");
  }

  public openWebsite() {
    let img = this.selectedImage.photo as IGeoImage;
    window.open(img.detailsUrl, "_blank");
  }
}
