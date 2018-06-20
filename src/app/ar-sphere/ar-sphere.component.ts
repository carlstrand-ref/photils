import { Component, ElementRef, EventEmitter, OnInit, OnDestroy, HostListener, Output, ViewChild} from '@angular/core';
import { Utils } from '../utils';
import { CustomFreeCameraDeviceOrientationInput } from './freeCameraDeviceOrientationInputCustom';

@Component({
  selector: 'app-ar-sphere',
  templateUrl: './ar-sphere.component.html',
  styleUrls: ['./ar-sphere.component.scss']
})
export class ArSphereComponent implements OnInit , OnDestroy {
  @Output() onReady: EventEmitter<any> = new EventEmitter();
  @ViewChild('needle') needle: ElementRef;
  
  private deviceOrientationDataTimeout:number = 2000;
  public error:string = undefined;  
  public isNorthDirection = false;
  public hasOrientationData = false;
  public hasVideo = false;
  public isMobile:boolean = false;
  public scene; 
  private videoObject; 
  private canvas;
  private engine;  
  private camera: BABYLON.FreeCamera;
  private gyro : {alpha: number, beta: number, gamma: number } = {alpha: 0, beta: 0, gamma: 0};
  private initialPosition = undefined;  

  constructor(
    private window: Window
  ) {
    this.isMobile = navigator.userAgent.indexOf("Mobile") !== -1;
  }

  ngOnInit() {    
    this.initSensors();    
  }

  getPosition(options?) : Promise<any> {
    if(!navigator.geolocation)
        throw Error("Geolocation not supported!");

    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }    

  ngOnDestroy() {
    this.stopVideo()
  }

  private async initSensors() {
    try {      
      if (!('ondeviceorientationabsolute' in this.window))
        throw Error('The deviceorientationabsolute Event is not supported but requried');      

      let constraint = { audio: false, video: { facingMode: this.isMobile ? 'environment' : 'user' } };  
      this.videoObject = document.createElement('video');
      this.videoObject.srcObject = await navigator.mediaDevices.getUserMedia(constraint);    
      this.videoObject.onloadedmetadata = () => {
        this.hasVideo = true;
        this.videoObject.play();
      }    

      let position = await this.getPosition();
      let pos = Utils.latLonToXYZ(position.coords.latitude, position.coords.longitude);      
      this.initialPosition = new BABYLON.Vector3(
        pos.x / 1000.0, 
        position.coords.altitude / 1000.0, 
        pos.y / 1000.0
      );

      await this.checkOrientationData();

    } catch(ex) {      
      this.error = ex.name + ": " + ex.message;
    }
  }

  private async checkOrientationData() : Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {        
        try {
          if(!this.hasOrientationData)
            throw Error('Timeout in deviceorientationabsolute Event. No orientation data were received.');      
        } catch (e) {          
          reject(e)
        }
      }, this.deviceOrientationDataTimeout);
    });
  }

  private stopVideo() {
    if(this.hasVideo) {
      this.videoObject.pause();
      let tracks = this.videoObject.srcObject.getTracks();

      tracks.forEach(function(track) {
        track.stop();
      });
      this.videoObject.srcObject = null;
    }
  }

  private initEngine() {
    this.canvas = document.getElementById('canvas');
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = this.createScene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });   

    this.onReady.emit();
  }

  private createScene() {    
    let scene = new BABYLON.Scene(this.engine);    
    this.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0.0), scene);     
    this.camera.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(BABYLON.Matrix.RotationY(BABYLON.Tools.ToRadians(this.gyro.alpha)));
    this.camera.position =  this.initialPosition;
    //this.camera.fov = 1.345649;
    this.camera.speed = 0.01;
    this.camera.minZ = 0.0001;   
    this.camera.maxZ = 10000;
    this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA; 
    this.camera.orthoLeft = -0.5;
    this.camera.orthoRight = 0.5;
    this.camera.orthoTop = 0.5;
    this.camera.orthoBottom = -0.5;                
    this.camera.inputs.add(new CustomFreeCameraDeviceOrientationInput(this.gyro.alpha, this.gyro.beta, this.gyro.gamma));
    this.camera.attachControl(this.canvas, true);    

    // remove unused inputs for mobile
    if(this.isMobile) {
      this.camera.inputs.removeByType("FreeCameraTouchInput");
      this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
      this.camera.inputs.removeByType("FreeCameraMouseInput");
    }

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
    });

    return scene;
  }

  private rotateNeedle(deg) {
    deg -= 45; // 45deg = reset needle to north   
    this.needle.nativeElement.setAttribute("transform", "rotate(" + deg + " 17 16)");
  }
  
  @HostListener('window:deviceorientationabsolute', ["$event"]) 
  handleOrientation(e) {          
    // https://developers.google.com/web/updates/2016/03/device-orientation-changes
    // values explained https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained    
    if(e.absolute && e.alpha !== null) {
      this.gyro.alpha = e.alpha;        
      this.hasOrientationData = true;

      if(!this.isNorthDirection && this.initialPosition !== undefined) {                                 
        this.isNorthDirection = true;                        
        this.initEngine();                
      }
    }

    return false;
  }
}
