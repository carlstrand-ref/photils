import { Component, Output, OnInit, AfterViewInit, OnDestroy, HostListener, AfterContentChecked, EventEmitter } from '@angular/core';
import { DofCalculation } from '../dof.component';
import * as BABYLON from 'babylonjs';
import { LOCATION_INITIALIZED } from '@angular/common';

@Component({
  selector: 'dof-visualizer',
  templateUrl: './dof-visualizer.component.html',
  styleUrls: ['./dof-visualizer.component.scss']
})
export class DofVisualizerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() onInit: EventEmitter<any> = new EventEmitter();
  private canvas;
  private engine;
  private scene;
  private pipeline;
  private leftCamera: BABYLON.DeviceOrientationCamera;
  private rightCamera: BABYLON.FreeCamera;
  private dofObjects = {nearPlane: undefined, farPlane: undefined, dof: undefined};
  private orthoRect: BABYLON.Vector2 = new BABYLON.Vector2(51, 51)

  public colors = {
    farPlane: new BABYLON.Color3(1, 0.6, 0.27),
    nearPlane: BABYLON.Color3.Blue(),
    dof: BABYLON.Color3.Green()
  }


  @HostListener('window:resize') onResize() {
    this.resize();
  }

  ngAfterViewInit() {
    this.resize();
  }

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = this.createScene();

    let init = false;
    this.engine.runRenderLoop(() => {
      this.scene.render();

      if(!init) {
        this.onInit.emit();
        init = true;
      }
    });
  }

  ngOnDestroy() {
    this.engine.stopRenderLoop();
  }

  public updateCamera(fov:number) {
    this.leftCamera.fov = fov;
  }

  public updateDoF(fStop:number, focalLength:number, focusDistance:number, dofAttrs:DofCalculation) {
    this.pipeline.depthOfField.focalLength = focalLength * 10;
    this.pipeline.depthOfField.fStop = fStop;
    this.pipeline.depthOfField.focusDistance = focusDistance;

    let farLimit = dofAttrs.farLimit == Infinity ? 200 : dofAttrs.farLimit;
    let dof = dofAttrs.DoF == Infinity ? 200 : dofAttrs.DoF;

    this.dofObjects.nearPlane.position = new BABYLON.Vector3(1.5, 1.5, dofAttrs.nearLimit - 1);
    this.dofObjects.farPlane.position  = new BABYLON.Vector3(1.5, 1.5, farLimit - 1);
    this.dofObjects.dof.position  = new BABYLON.Vector3(1.5, 1.5, farLimit - (dof / 2.0 ) - 1);
    this.dofObjects.dof.scaling = new BABYLON.Vector3(1.0, 1.0, dof - 0.1);

    let halfLimit = farLimit / 2.0;
    this.orthoRect.x = halfLimit + 1;
    this.orthoRect.y = halfLimit + 1;
    this.updateApsectRatio();

    this.rightCamera.position = new BABYLON.Vector3(10, 1.5, halfLimit);
    this.rightCamera.setTarget(new BABYLON.Vector3(0, 1.5, halfLimit));

  }


  private createScene() {
    // Create scene
    let sideBySide = (this.canvas.width / this.canvas.height) >= 1;
    let scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color4(0.18,0.18,0.18, 1.0);

    this.leftCamera = new BABYLON.DeviceOrientationCamera("camera1", new BABYLON.Vector3(0, 1.5, -1.0), scene);
    this.leftCamera.speed = 0.01;
    this.leftCamera.minZ = 0.001;
    this.leftCamera.layerMask = ~0b11;
    this.leftCamera.attachControl(this.canvas, true);
    if(navigator.userAgent.indexOf("Mobile") !== -1) {
      this.leftCamera.inputs.removeByType("FreeCameraTouchInput");
      this.leftCamera.inputs.removeByType("FreeCameraKeyboardMoveInput");
      this.leftCamera.inputs.removeByType("FreeCameraMouseInput");
    }

    this.rightCamera = new BABYLON.FreeCamera("camera2", new BABYLON.Vector3(50, 1.5, 50), scene);
    this.rightCamera.setTarget(new BABYLON.Vector3(0, 1.5, 50));
    this.rightCamera.layerMask = 0b11;
    this.rightCamera.speed = 0.01;
    this.rightCamera.minZ = 0.001;
    this.rightCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    this.rightCamera.orthoLeft = -this.orthoRect.x;
    this.rightCamera.orthoRight = this.orthoRect.x;
    this.rightCamera.orthoTop = this.orthoRect.y;
    this.rightCamera.orthoBottom = -this.orthoRect.y;

    this.leftCamera.viewport = new BABYLON.Viewport(0, 0, sideBySide ? 0.5 : 1.0, sideBySide ? 1.0 : 0.5);
    this.rightCamera.viewport = new BABYLON.Viewport(sideBySide ? 0.5 : 0.0, sideBySide ? 0.0 : 0.5, sideBySide ? 0.5 : 1.0, sideBySide ? 1.0 : 0.5);
    new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(10, 10.0, 50.0), scene);

    let pbr = new BABYLON.PBRMetallicRoughnessMaterial("pbr", scene);
    pbr.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/textures/environment.dds", scene);
    let gridSize = 2;
    for(let i=1;i<=gridSize;i++){
        for(let j=0;j<100;j++){
            let sphereMat = pbr.clone("sphereMat");
            sphereMat.metallic = 0.1;
            sphereMat.roughness = 0.0;
            sphereMat.baseColor = BABYLON.Color3.White()
            let sphere = BABYLON.Mesh.CreateSphere("sphere", 16, 0.8, scene);
            sphere.material = sphereMat;
            sphere.position.y = i*1.0;
            sphere.position.x = 1.0;
            sphere.position.z = j*1.0;

            sphereMat = pbr.clone("sphereMat");
            sphereMat.metallic = 0.1;
            sphereMat.roughness = 0.0;
            sphereMat.baseColor = BABYLON.Color3.White()
            sphere = BABYLON.Mesh.CreateSphere("sphere", 16, 0.8, scene);
            sphere.material = sphereMat;
            sphere.position.y = i*1.0;
            sphere.position.x = -1.0;
            sphere.position.z = j*1.0;
        }
    }

    let matOrange = pbr.clone("matOrange");
    matOrange.metallic = 0.0;
    matOrange.roughness = 1.0;
    matOrange.baseColor = this.colors.nearPlane;

    let matGreen = pbr.clone("matGreen");
    matGreen.metallic = 0.0;
    matGreen.roughness = 1.0;
    matGreen.baseColor = this.colors.dof;

    let matBlue = pbr.clone("matBlue");
    matBlue.metallic = 0.0;
    matBlue.roughness = 1.0;
    matBlue.baseColor = this.colors.farPlane;

    this.dofObjects.nearPlane = BABYLON.MeshBuilder.CreateBox( "nearPlane", {height: 2, width: 0.1, depth:0.1 }, scene);
    this.dofObjects.farPlane = BABYLON.MeshBuilder.CreateBox( "farPlane", {height: 2, width: 0.1, depth: 0.1 }, scene);
    this.dofObjects.dof = BABYLON.MeshBuilder.CreateBox( "farPlane", {height: 2, width: 0.1, depth: 1.0 }, scene);

    this.dofObjects.nearPlane.material = matOrange;
    this.dofObjects.farPlane.material = matBlue;
    this.dofObjects.dof.material = matGreen;

    this.dofObjects.nearPlane.position = new BABYLON.Vector3(1.5, 1.5, 0.0);
    this.dofObjects.farPlane.position  = new BABYLON.Vector3(1.5, 1.5, 0.0);
    this.dofObjects.dof.position  = new BABYLON.Vector3(1.4, 1.5, 0.0);
    this.dofObjects.dof.visibility = 0.8;

    this.dofObjects.nearPlane.layerMask = 0b11;
    this.dofObjects.farPlane.layerMask = 0b11;
    this.dofObjects.dof.layerMask = 0b11;

    scene.activeCameras.push(this.leftCamera);
    scene.activeCameras.push(this.rightCamera);

    // Create default pipeline and enable dof with Medium blur level
    this.pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [scene.activeCamera]);
    this.pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.High;
    this.pipeline.depthOfFieldEnabled = true;
    this.pipeline.depthOfField.focalLength = 180;
    this.pipeline.depthOfField.fStop = 3;
    this.pipeline.depthOfField.focusDistance = 2250;

    return scene;
  }

  private resize() {
    let sideBySide = (this.canvas.width / this.canvas.height) >= 1;
    this.leftCamera.viewport = new BABYLON.Viewport(0, 0, sideBySide ? 0.5 : 1.0, sideBySide ? 1.0 : 0.5);
    this.rightCamera.viewport = new BABYLON.Viewport(sideBySide ? 0.5 : 0.0, sideBySide ? 0.0 : 0.5, sideBySide ? 0.5 : 1.0, sideBySide ? 1.0 : 0.5);

    this.updateApsectRatio();
    this.engine.resize();
  }

  private updateApsectRatio() {
    let sideBySide = (this.canvas.width / this.canvas.height) >= 1;
    let w = sideBySide ? this.canvas.width * 0.5 : this.canvas.width;
    let h = sideBySide ? this.canvas.height : this.canvas.height * 0.5;

    let ratio = Math.max(w, h) / Math.min(w, h);
    let width = 1.0;
    let height = 1.0;

    if(w >= h) width *= ratio;
    else height *= ratio;

    this.rightCamera.orthoLeft = -this.orthoRect.x * width;
    this.rightCamera.orthoRight = this.orthoRect.x * width;
    this.rightCamera.orthoTop = this.orthoRect.y * height;
    this.rightCamera.orthoBottom = -this.orthoRect.y * height;
  }
}
