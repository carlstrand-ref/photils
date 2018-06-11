import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import * as BABYLON from 'babylonjs';

@Component({
  selector: 'dof-visualizer',
  templateUrl: './dof-visualizer.component.html',
  styleUrls: ['./dof-visualizer.component.css']
})
export class DofVisualizerComponent implements AfterViewInit {
  private canvas;
  private engine;
  private scene; 
  private pipeline;
  private leftCamera;

  constructor() { 
    
  }

  ngAfterViewInit() {
    this.canvas = document.getElementById('canvas');
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = this.createScene();

    let self = this;
    this.engine.runRenderLoop(function() {
      self.scene.render();
    });
  } 

  public updateCamera(fov:number) {
    console.log(fov);
    this.leftCamera.fov = fov;
  }

  public updateDoF(fStop:number, focalLength:number, focusDistance:number) {
    this.pipeline.depthOfField.focalLength = focalLength * 1000.0;
    this.pipeline.depthOfField.fStop = fStop;
    this.pipeline.depthOfField.focusDistance = focusDistance * 1000.0;
  }

  private createScene() {
    // Create scene
    let sideBySide = (this.canvas.width / this.canvas.height) >= 1;
    let scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color4(0.5,0.5,0.5, 1.0);

    this.leftCamera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1.5, -1.0), scene);
    this.leftCamera.speed = 0.01;
    this.leftCamera.minZ = 0.001;
    this.leftCamera.attachControl(this.canvas, true);    

    let rightCamera = new BABYLON.ArcRotateCamera("camera2", 0, Math.PI / 2.0, 100, new BABYLON.Vector3(0.0, 0.5, 50.0), scene);
    rightCamera.speed = 0.01;
    rightCamera.minZ = 0.001;    
    

    this.leftCamera.viewport = new BABYLON.Viewport(0, 0, sideBySide ? 0.5 : 1.0, sideBySide ? 1.0 : 0.5);
    rightCamera.viewport = new BABYLON.Viewport(sideBySide ? 0.5 : 0.0, sideBySide ? 0.0 : 0.5, sideBySide ? 0.5 : 1.0, sideBySide ? 1.0 : 0.5);

    new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(0, 10.0, 100.0), scene);    

    let pbr = new BABYLON.PBRMetallicRoughnessMaterial("pbr", scene);
    pbr.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/textures/environment.dds", scene);
    let gridSize = 4;
    for(let i=0;i<gridSize;i++){
        for(let j=0;j<66;j++){
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

    scene.activeCameras.push(this.leftCamera);
    scene.activeCameras.push(rightCamera);
    
    // Create default pipeline and enable dof with Medium blur level
    this.pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [scene.activeCamera]);
    this.pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Medium;
    this.pipeline.depthOfFieldEnabled = true;
    this.pipeline.depthOfField.focalLength = 180;
    this.pipeline.depthOfField.fStop = 3;
    this.pipeline.depthOfField.focusDistance = 2250;    

    return scene;
}

}
