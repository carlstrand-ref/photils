import { Component, ElementRef, EventEmitter, OnInit, OnDestroy, HostListener, Output, ViewChild} from '@angular/core';
import { Utils } from '../utils';
import { CustomFreeCameraDeviceOrientationInput } from './freeCameraDeviceOrientationInputCustom';
import { Engine, Vector2, Vector3, QuadraticEase, Quaternion, Tools } from 'babylonjs';
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
  public hasVideo = false;
  public scene: BABYLON.Scene;
  private videoObject;
  private canvas;
  private engine:BABYLON.Engine;
  private camera: BABYLON.DeviceOrientationCamera;
  public orientationResult: AbsoluteDeviceOrientationResult; // initial orientation for placing objects in the world
  public cameraOffset: Vector3; // offset angle from forward vector after DeviceOrientation initialization
  public geoLocation: {lat: number, lon: number};
  public showFps: boolean = true;

  constructor(public deviceOrientation: AbsoluteDeviceOrientationService) { }

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
      let constraints = { audio: false, video: { width: 1280, height: 720, facingMode: Utils.isMobile ? 'environment' : 'user' } };
      this.videoObject = document.createElement('video');
      this.videoObject.srcObject = await navigator.mediaDevices.getUserMedia(constraints);

      this.videoObject.onloadedmetadata = () => {
        this.hasVideo = true;
        this.videoObject.play();
        //let settings = this.videoObject.srcObject.getTracks()[0].getSettings();
      }

      let position = await this.getPosition();
      this.geoLocation = {lat: position.coords.latitude, lon: position.coords.longitude};

      let reseted = false;

      let err = (err) => {throw err; }

      this.deviceOrientation.deviceOrientationChanged.subscribe((e:AbsoluteDeviceOrientationResult) => {
        if(!this.orientationResult) {
          this.orientationResult = e;
          this.initEngine();
        }

        this.rotateNeedle(e.alpha);
      }, (err) => {
        if(!Utils.isMobile) {
          this.orientationResult = new AbsoluteDeviceOrientationResult(
            new DeviceOrientationEvent("")
          );
          this.initEngine();
        }
      });



    } catch(ex) {
      this.error = ex.name + ": " + ex.message;
      this.stopVideo();
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
  }

  private createScene() {
    let scene = new BABYLON.Scene(this.engine);
    scene.ambientColor = new BABYLON.Color3(1, 1, 1);

    this.camera = new BABYLON.DeviceOrientationCamera("camera1", new BABYLON.Vector3(0, 0, 0.0), scene);
    this.camera.minZ = 0.4;
    //this.camera.inputs.add(new CustomFreeCameraDeviceOrientationInput(this.deviceOrientation));
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

    scene.onAfterCameraRenderObservable.add(() => {
      if(
        !this.camera.rotationQuaternion.equals(new Quaternion(0, 0, 0, 1)) &&
        !this.cameraOffset
      ) {
        console.log("time to reset", this.camera.rotationQuaternion);
        this.cameraOffset = this.camera.rotationQuaternion.toEulerAngles();;
        let d = this.cameraOffset;
        console.log("eula", Tools.ToDegrees(d.x), Tools.ToDegrees(d.y), Tools.ToDegrees(d.z) )
        this.onReady.emit();
      }
    })

    return scene;
  }

  private rotateNeedle(deg) {
    deg += 45; // 45deg = reset needle to north
    this.needle.nativeElement.setAttribute("transform", "rotate(" + -deg + " 17 16)");
  }

  // @HostListener('$window:resize')
  // handleResize() {
  //   this.engine.resize();
  //   return false;
  // }
}
