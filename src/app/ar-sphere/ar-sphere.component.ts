import { Component, ElementRef, EventEmitter, OnInit, OnDestroy, HostListener, Output, ViewChild} from '@angular/core';
import { Utils } from '../utils';
import { CustomFreeCameraDeviceOrientationInput } from './freeCameraDeviceOrientationInputCustom';
import { Engine } from 'babylonjs';
import { AbsoluteDeviceOrientationService, AbsoluteDeviceOrientationResult } from '../absolute-device-orientation.service'

declare const window: any;

@Component({
  selector: 'app-ar-sphere',
  templateUrl: './ar-sphere.component.html',
  styleUrls: ['./ar-sphere.component.scss']
})
export class ArSphereComponent implements OnInit , OnDestroy {
  @Output() onReady: EventEmitter<any> = new EventEmitter();
  @ViewChild('needle') needle: ElementRef;
  @ViewChild("fpsCounter") fpsCounter: ElementRef;
  
  public error:string = undefined;  
  public isNorthDirection = false;
  public hasOrientationData = false;
  public hasVideo = false;
  public isMobile:boolean = false;
  public scene: BABYLON.Scene;   
  private videoObject; 
  private canvas;
  private engine:BABYLON.Engine;  
  private camera: BABYLON.FreeCamera;
  public orientationResult: AbsoluteDeviceOrientationResult;
  private initialPosition = undefined;  
  public geoLocation: {lat: number, lon: number};
  public showFps: boolean = true;

  constructor(public deviceOrientation: AbsoluteDeviceOrientationService) {
    this.isMobile = Utils.isMobile;
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
      let constraints = { audio: false, video: { width: 1280, height: 720, facingMode: this.isMobile ? 'environment' : 'user' } };  
      this.videoObject = document.createElement('video');      
      this.videoObject.srcObject = await navigator.mediaDevices.getUserMedia(constraints);    
      
      this.videoObject.onloadedmetadata = () => {
        this.hasVideo = true;
        this.videoObject.play();
        //let settings = this.videoObject.srcObject.getTracks()[0].getSettings();
      }    

      let position = await this.getPosition();
      this.geoLocation = {lat: position.coords.latitude, lon: position.coords.longitude};
      this.initialPosition = new BABYLON.Vector3( 0,0,0 );
            
      this.orientationResult = await this.deviceOrientation.deviceOrientationReady.toPromise();
      this.deviceOrientation.deviceOrientationChanged.subscribe((e:AbsoluteDeviceOrientationResult) => {
        this.rotateNeedle(e.alpha);
      });
      
      this.initEngine(); 

    } catch(ex) {   
      if(Utils.isMobile) {   
        this.error = ex.name + ": " + ex.message;
        this.stopVideo();
      } else {
        // ugly but for testing issues
        // if we have desktop without sensor
        // still init engine 
        this.initEngine();
      }
    }
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
    this.engine = new BABYLON.Engine(this.canvas, true, {doNotHandleContextLost: true});
    this.scene = this.createScene();
    

    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.fpsCounter.nativeElement.innerHTML = this.engine.getFps().toFixed(0) + " FPS";
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
    if(Utils.isMobile) {
      this.camera.inputs.removeByType("FreeCameraTouchInput");
      this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
      this.camera.inputs.removeByType("FreeCameraMouseInput");
    }

    let background = new BABYLON.Layer("back", null, scene);
	  background.texture = new BABYLON.VideoTexture("livestream", this.videoObject, scene, false);     
	  background.isBackground = true;
    background.texture.level = 0;
    
    new BABYLON.HemisphericLight("HemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);

    return scene;
  }

  private rotateNeedle(deg) {
    deg += 45; // 45deg = reset needle to north   
    this.needle.nativeElement.setAttribute("transform", "rotate(" + -deg + " 17 16)");
  }

  @HostListener('window:resize')
  handleResize() {
    this.engine.resize();

    return false;
  }
}
