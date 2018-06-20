import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener} from '@angular/core';
import { Utils } from '../utils';
import { MatHorizontalStepper } from '@angular/material';
import { CustomFreeCameraDeviceOrientationInput } from './freeCameraDeviceOrientationInputCustom';

@Component({
  selector: 'app-ar-sphere',
  templateUrl: './ar-sphere.component.html',
  styleUrls: ['./ar-sphere.component.scss']
})
export class ArSphereComponent implements OnInit , OnDestroy{
  public orientationSupported = false;
  public isNorthDirection = false;
  public hasVideo = false;
  public isMobile:boolean = false;
  private root:BABYLON.TransformNode;
  private videoObject; 
  private canvas;
  private engine;
  private scene; 
  private camera: BABYLON.FreeCamera;
  private needle;  
  private gyro : {alpha: number, beta: number, gamma: number } = {alpha: 0, beta: 0, gamma: 0};
  private initialPosition = undefined;

  private dummyData :{ lat: number, lon: number, altitude: number, title: string }[] = [
    { lat: 51.98364221, lon: 9.81239562, altitude: 94, title:'Fargus Grecon' },
    { lat: 52.003723, lon: 9.834583, altitude: 320.0, title:'Himmelbergturm' },
    { lat: 51.99344372, lon: 9.81900254, altitude: 92, title:'MM Packaging' },
    { lat: 51.994069, lon: 9.823915, altitude: 100, title:'Mozardstraße' },
  ]

  // https://developers.google.com/web/updates/2016/03/device-orientation-changes
  @HostListener('window:deviceorientationabsolute', ["$event"]) 
  //@HostListener('window:deviceorientation', ["$event"]) 
  handleOrientation(e) {      
    // values explained https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained    
    if(e.absolute) {
      this.orientationSupported = true;
      //this.rotateNeedle(e.alpha);                          
      this.gyro.alpha = e.alpha;        

      if(!this.isNorthDirection && this.initialPosition !== undefined) {                                 
        this.isNorthDirection = true;                
        this.initEngine();        
        this.placeLocations(this.dummyData);
      }
    }

    return false;
  }

  constructor(private cdRef: ChangeDetectorRef) {
    this.isMobile = navigator.userAgent.indexOf("Mobile") !== -1;
  }

  ngOnInit() {    

    let constraint = {
      audio: false,
      video: {
        facingMode: this.isMobile ? 'environment' : 'user'       
      }
    };  

    if(!navigator.geolocation)
      return

    this.videoObject = document.createElement('video');

    navigator.mediaDevices.getUserMedia(constraint)
    .then((stream) => {
      this.videoObject.srcObject = stream;
      this.videoObject.onloadedmetadata = () => {
        this.videoObject.play();
      }    
      return this.getPosition();
    })
    .then(position => {              
      console.log(position);    
      let pos = Utils.latLonToXYZ(position.coords.latitude, position.coords.longitude);      
      this.initialPosition = new BABYLON.Vector3(
        pos.x / 1000.0, position.coords.altitude / 1000.0, pos.y / 1000.0
      );
    })
    .catch(function(err) {
      console.log(err.name + ": " + err.message);
    });
    
    this.needle = document.getElementById('needle');
  }

  getPosition(options?) {
    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }    

  ngOnDestroy() {
    if(this.hasVideo) {
      this.videoObject.video.pause();
      let tracks = this.videoObject.video.srcObject.getTracks();

      tracks.forEach(function(track) {
        track.stop();
      });
      this.videoObject.video.srcObject = null;
    }
  }

  initEngine() {
    this.canvas = document.getElementById('canvas');
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = this.createScene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });   
  }

  private createScene() {    
    let scene = new BABYLON.Scene(this.engine);    
    this.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0.0), scene);     
    this.camera.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(BABYLON.Matrix.RotationY(BABYLON.Tools.ToRadians(this.gyro.alpha)));
    this.camera.position =  this.initialPosition;
    this.camera.speed = 0.01;
    this.camera.minZ = 0.0001;   
    this.camera.maxZ = 10000;
    this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA; 
    this.camera.orthoLeft = -0.5;
    this.camera.orthoRight = 0.5;
    this.camera.orthoTop = 0.5;
    this.camera.orthoBottom = -0.5;            
    this.camera.attachControl(this.canvas, true);    
    this.camera.inputs.add(new CustomFreeCameraDeviceOrientationInput(this.gyro.alpha, this.gyro.beta, this.gyro.gamma));

    // Video plane
    let videoPlane = BABYLON.Mesh.CreatePlane("Screen", 1, scene);
    videoPlane.position.y = 0;
    videoPlane.position.z = 100;    
    videoPlane.parent = this.camera
    if(!this.isMobile)
      videoPlane.rotation.y = Math.PI;

    // Video material
    let videoMat = new BABYLON.StandardMaterial("textVid", scene);    
    videoMat.emissiveColor = new BABYLON.Color3(1,1,1);
    videoMat.backFaceCulling = false;
      
    videoMat.diffuseTexture = new BABYLON.VideoTexture("livestream", this.videoObject, scene, null);     
    videoPlane.material = videoMat;   

    scene.onAfterCameraRenderObservable.add(() => {      
      this.rotateNeedle(this.gyro.alpha);
    })

    return scene;
  }

  private rotateNeedle(deg) {
    deg -= 45; // 45deg = reset needle to north
    //let mat = this.needle.getCTM();    
    //let matDeg = ((180 / Math.PI) * Math.atan2(mat.b, mat.a));
    this.needle.setAttribute("transform", "rotate(" + deg + " 17 16)");
  }

  private placeLocations(locations : { lat: number, lon: number, altitude: number, title: string }[]) {
    for( const location of locations ) {
      let coords = Utils.latLonToXYZ(location['lat'], location['lon']);      
      let pos = new BABYLON.Vector3(coords.x / 1000.0, location.altitude / 1000.0, coords.y / 1000.0);
      
      
      let box = BABYLON.MeshBuilder.CreatePlane("wall", {width: 0.25, height: 0.125}, this.scene);            
      box.position = pos;
      box.lookAt(this.camera.position);      

      let font = "bold 44px monospace";
      let dynTexture =  new BABYLON.DynamicTexture(location.title, {width:512, height:256}, this.scene);
      dynTexture.drawText(location.title, 75, 135, font, "green", "white", true, true);

      let boxMaterial = new BABYLON.StandardMaterial("material", this.scene);
      boxMaterial.emissiveColor = new BABYLON.Color3(0.58, 0, 0.86);
      boxMaterial.diffuseTexture = dynTexture;
      boxMaterial.backFaceCulling = true;
      box.material = boxMaterial;

      console.log(BABYLON.Vector3.DistanceSquared(this.camera.position, pos));
    }
  }
}
