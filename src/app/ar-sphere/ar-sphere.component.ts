import { Component, ElementRef, EventEmitter, OnInit, OnDestroy, HostListener, Output, ViewChild} from '@angular/core';
import { Utils } from '../utils';
import { CustomFreeCameraDeviceOrientationInput } from './freeCameraDeviceOrientationInputCustom';

declare const window: any;

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
  public scene: BABYLON.Scene;   
  private videoPlane;
  private videoObject; 
  private canvas;
  private engine;  
  private camera: BABYLON.FreeCamera;
  public heading: number;
  private initialPosition = undefined;  
  public geoLocation: {lat: number, lon: number};

  constructor() {
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
    this.scene.dispose();
    this.engine.dispose(); 
  }

  public reset() {
    this.stopVideo();
    this.scene.dispose();
    this.engine.dispose();    

    this.initSensors();
  }

  private async initSensors() {
    try {      
      if (!('ondeviceorientationabsolute' in window))
        throw Error('The deviceorientationabsolute Event is not supported but requried');      

      let constraints = { audio: false, video: { width: 1280, height: 720, facingMode: this.isMobile ? 'environment' : 'user' } };  
      this.videoObject = document.createElement('video');      
      this.videoObject.srcObject = await navigator.mediaDevices.getUserMedia(constraints);    
      
      this.videoObject.onloadedmetadata = () => {
        this.hasVideo = true;
        this.videoObject.play();
        let settings = this.videoObject.srcObject.getTracks()[0].getSettings();

        // let verticalHalf = 0.5;
        // let horizontalHalf = 0.5;

        // let canvasAspect = (Math.max(this.canvas.width, this.canvas.height) / Math.min(this.canvas.width, this.canvas.height))
        // if(this.canvas.width > this.canvas.height) {          
        //   horizontalHalf = canvasAspect / 2.0;
        // } else {          
        //   verticalHalf = canvasAspect / 2.0;          
        // }
      }    

      let position = await this.getPosition();
      this.geoLocation = {lat: position.coords.latitude, lon: position.coords.longitude};
      let pos = Utils.latLonToXYZ(position.coords.latitude, position.coords.longitude);      
      this.initialPosition = new BABYLON.Vector3(
        // pos.x / 1000.0, 
        // pos.z / 1000.0, 
        // pos.y / 1000.0
        0,0,0
      );

      await this.checkOrientationData();

    } catch(ex) {      
      this.error = ex.name + ": " + ex.message;
      this.stopVideo();
    }
  }

  private async checkOrientationData() : Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {        
        try {
          // if(!this.hasOrientationData)
          //   throw Error('Timeout in deviceorientationabsolute Event. No orientation data were received.');      
          resolve();
          this.initEngine(); 
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

      this.hasVideo = false;
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
    scene.ambientColor = new BABYLON.Color3(1, 1, 1);

    this.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0.0), scene);         
    this.camera.position =  this.initialPosition;    
    this.camera.minZ = 0.4;     
    this.camera.inputs.add(new CustomFreeCameraDeviceOrientationInput(0));
    this.camera.attachControl(this.canvas, true);   
    

    // remove unused inputs for mobile
    if(this.isMobile) {
      this.camera.inputs.removeByType("FreeCameraTouchInput");
      this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
      this.camera.inputs.removeByType("FreeCameraMouseInput");
    }

    let background = new BABYLON.Layer("back", null, scene);
	  background.texture = new BABYLON.VideoTexture("livestream", this.videoObject, scene, false);     
	  background.isBackground = true;
    background.texture.level = 0;
    
    new BABYLON.HemisphericLight("HemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);

    scene.onAfterRenderObservable.add(() => {      
      this.rotateNeedle(this.heading);
    });

    return scene;
  }

  private rotateNeedle(deg) {
    deg += 45; // 45deg = reset needle to north   
    this.needle.nativeElement.setAttribute("transform", "rotate(" + -deg + " 17 16)");
  }
  
  @HostListener('window:deviceorientationabsolute', ["$event"]) 
  handleOrientation(e) {          
    // https://developers.google.com/web/updates/2016/03/device-orientation-changes
    // values explained https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained    
    if(e.absolute && e.alpha !== null) {
      
      let heading = e.compassHeading || e.webkitCompassHeading || Utils.compassHeading(e.alpha, e.beta, e.gamma);            
    
      this.hasOrientationData = true;
      this.heading = heading;

      if(!this.isNorthDirection && this.initialPosition !== undefined) {                                 
        this.isNorthDirection = true;                        
                       
      }
    }

    return false;
  }
}
