import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener} from '@angular/core';


@Component({
  selector: 'app-ar-sphere',
  templateUrl: './ar-sphere.component.html',
  styleUrls: ['./ar-sphere.component.scss']
})
export class ArSphereComponent implements OnInit , OnDestroy{
  public orientationSupported = false;
  public hasVideo = false;
  public isMobile:boolean = false;
  private videoObject; 
  private canvas;
  private engine;
  private scene; 
  private camera: BABYLON.DeviceOrientationCamera;
  private needle;

  @HostListener('window:deviceorientation', ["$event"]) handleOrientation(e) {    
    //console.log(e);  
    // values explained https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
    this.orientationSupported = true;
  }

  constructor(private cdRef: ChangeDetectorRef) {
    this.isMobile = navigator.userAgent.indexOf("Mobile") !== -1;
  }

  ngOnInit() {
    console.log(navigator.geolocation);
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(position => {        
        console.log(position.coords); 
      }, err => {
        console.log("error: ", err);
      });
    }

    this.initEngine();

    this.needle = document.getElementById('needle');
  }

  ngOnDestroy() {
    console.log(this.videoObject.video);
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

    let self = this;    
    this.engine.runRenderLoop(function() {
      self.scene.render();
    });   
  }

  private createScene() {        
    let scene = new BABYLON.Scene(this.engine);
    this.camera = new BABYLON.DeviceOrientationCamera("camera1", new BABYLON.Vector3(0, 0, 0.0), scene);
    
    this.camera.speed = 0.01;
    this.camera.minZ = 0.001;   
    this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA; 
    this.camera.orthoLeft = -0.5;
    this.camera.orthoRight = 0.5;
    this.camera.orthoTop = 0.5;
    this.camera.orthoBottom = -0.5;    
    this.camera.attachControl(this.canvas, true);

    // Video plane
    var videoPlane = BABYLON.Mesh.CreatePlane("Screen", 1, scene);
    videoPlane.position.y = 0;
    videoPlane.position.z = 100;
    videoPlane.rotation.z = Math.PI;
    videoPlane.rotation.y = Math.PI;
    videoPlane.parent = this.camera

    // Video material
    var videoMat = new BABYLON.StandardMaterial("textVid", scene);    
    videoMat.emissiveColor = new BABYLON.Color3(1,1,1);
    videoMat.backFaceCulling = false;

    let self = this;
    BABYLON.VideoTexture.CreateFromWebCam(scene, function (videoTexture) {
      self.videoObject = videoTexture;
      videoMat.diffuseTexture = self.videoObject;
    }, {facingMode: 'environment', minWidth: 128, minHeight: 128, maxWidth: 1280, maxHeight: 720 });     
    

    
    scene.onBeforeRenderObservable.add(function () {      
      if (self.videoObject !== undefined && self.hasVideo == false) {          
          if (self.videoObject.video.readyState == 4) {
            //Applying materials
            videoPlane.material = videoMat;
            self.hasVideo = true;
          }
      }

      self.rotateNeedle(new BABYLON.Angle(self.scene.activeCamera.rotationQuaternion.toEulerAngles().y).degrees());
    });

    return scene;
  }

  private rotateNeedle(deg) {
    deg -= 45; // 45deg = reset needle to north
    let mat = this.needle.getCTM();    
    //let matDeg = ((180 / Math.PI) * Math.atan2(mat.b, mat.a));
    this.needle.setAttribute("transform", "rotate(" + deg + " 17 16)");
  }

}
