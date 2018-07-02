import { Component, OnInit, AfterContentInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import KerasJS from 'keras-js';
import { imagenetClassesTopK } from './imagenet';
import ndarray from 'ndarray';
import ops from 'ndarray-ops';
import { MatSelectionList } from '@angular/material';
import { Utils } from '../utils';

@Component({
  selector: 'app-auto-tagger',
  templateUrl: './auto-tagger.component.html',
  styleUrls: ['./auto-tagger.component.scss']
})
export class AutoTaggerComponent implements OnInit {
  @ViewChild("dropzone") dropzone: ElementRef;
  @ViewChild("inputFile") inputFile: ElementRef;
  @ViewChild("srcImage") srcImage: ElementRef;
  @ViewChild(MatSelectionList) selectedTags: MatSelectionList;

  public showImage:boolean = false;
  public model:KerasJS.Model;
  public result: Array<{category: string, probability: number}>;
  public message:string;

  constructor() { }

  ngOnInit() {
    this.message = "loading model ...";
    (this.inputFile.nativeElement as any).addEventListener("change",(e) => {
      this.handleFile(e.target.files[0]);
    }, false);

    this.initModel();

  }

  private async initModel() {
    this.model = new KerasJS.Model({
      filepath: 'assets/model.bin',
      gpu: !Utils.isMobile
    });

    await this.model.ready();
    this.message = undefined;
  }

  public allowDrop(e:DragEvent) {
    e.preventDefault();
  }

  public drop(e:DragEvent) {
    e.preventDefault();
    this.handleFile(e.dataTransfer.files[0]);
  }

  public handleClick() {
    (this.inputFile.nativeElement as any).click();
  }

  private handleFile(file:File) {
    if(file.type.startsWith("image")) {
      this.message = "generate tags ...";
      const reader = new FileReader();
      reader.onload = (e) => {
        this.showImage = true;

        const raw = reader.result;
        let urlCreator = window.URL || window.webkitURL;
        let url = urlCreator.createObjectURL( new Blob( [raw], { type: file.type } ));
        (this.srcImage.nativeElement as any).src = url;
        (this.srcImage.nativeElement as any).onload = async () => {
          let data =  await this.resizeImage(this.srcImage.nativeElement, 224, 224);
          let preprocessed = this.preprocess(data.imageData);
          this.predict(preprocessed);
        }

      }
      reader.readAsArrayBuffer(file);
    }
  }

  private async predict(data) {
    const inputData = {
      input_1: data
    }
    try {
      let out:any = await this.model.predict(inputData);
      let labels = imagenetClassesTopK(out.fc1000, 10);
      this.result = labels;
      this.message = undefined;
    } catch(e) {
    }

  }

  private resizeImage(img, width, height) : Promise<{imageData: ImageData, blob: Blob}> {
    return new Promise<{imageData: ImageData, blob: Blob}>((resolve, reject) => {
      try {
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let imageData = ctx.getImageData(0, 0, width, height);
        canvas.toBlob(blob => {
          resolve({imageData: imageData, blob: blob});
        });
      } catch(e) { reject(e) };
    })
  }

  private preprocess(imageData:ImageData) : Float32Array {
    const { data, width, height } = imageData
    // data processing
    // see https://github.com/keras-team/keras/blob/master/keras/applications/imagenet_utils.py
    const dataTensor = ndarray(new Float32Array(data), [width, height, 4])
    const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [width, height, 3])
    ops.subseq(dataTensor.pick(null, null, 2), 103.939)
    ops.subseq(dataTensor.pick(null, null, 1), 116.779)
    ops.subseq(dataTensor.pick(null, null, 0), 123.68)
    ops.assign(dataProcessedTensor.pick(null, null, 0), dataTensor.pick(null, null, 2))
    ops.assign(dataProcessedTensor.pick(null, null, 1), dataTensor.pick(null, null, 1))
    ops.assign(dataProcessedTensor.pick(null, null, 2), dataTensor.pick(null, null, 0))
    return dataProcessedTensor.data
  }

}
