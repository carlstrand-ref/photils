import { Component, OnInit, Injectable,ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonToggleChange, MatDialog } from '@angular/material';
import * as tf from '@tensorflow/tfjs';
import {MatSnackBar} from '@angular/material';
import { PCA_COMPONENTES } from '../pca_components';
import { HttpClient } from '@angular/common/http';
import { DeviceDetectorService, DeviceInfo } from '../../../node_modules/ngx-device-detector';

@Component({
  selector: 'app-auto-tagger',
  templateUrl: './auto-tagger.component.html',
  styleUrls: ['./auto-tagger.component.scss']
})
export class AutoTaggerComponent implements OnInit {
  @ViewChild("dropzone") dropzone: ElementRef;
  @ViewChild("inputFile") inputFile: ElementRef;
  @ViewChild("srcImage") srcImage: ElementRef;

  public spinner = {mode : "determinate", value: 0};

  public showImage:boolean = false;
  public model:tf.Model;
  public result: Array<{category: string, probability: number}>;
  public message:string;
  public prefix:string = "";
  public tags:Array<any>;
  public legacy = false;
  public selectedTags:Array<string> = [];
  private pcaTensor:tf.Tensor2D;

  constructor(public snackBar: MatSnackBar, public dialog: MatDialog,
      private http: HttpClient, private deviceService: DeviceDetectorService) {
    this.legacy = this.deviceService.getDeviceInfo().device === 'iphone';

    console.log("legacy: ", this.legacy, this.deviceService.getDeviceInfo());
  }

  ngOnInit() {
    (this.inputFile.nativeElement as any).addEventListener("change",(e) => {
      this.handleFile(e.target.files[0]);
    }, false);

    if(!this.legacy)
      this.initModel();
  }

  private async initModel() {
    try {
      this.message = "loading model ...";
      this.spinner.mode = "indeterminate";
      this.model = await tf.loadModel('assets/tfsmodel/model.json');
      this.pcaTensor = tf.tensor2d(PCA_COMPONENTES);
    } catch(e) {
      //this.snackBar.open("Error: " + e.message, "", { duration: 5000, panelClass: 'error'})
      this.legacy = true;
    } finally {
      this.message = undefined;
    }
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

  public togglePrefix() {
    this.prefix = this.prefix === '' ? '#' : '';
  }

  public toggleTag(e:MatButtonToggleChange) {
    if(e.source.checked) {
      this.selectedTags.push(e.value);
    } else {
      this.selectedTags.splice(this.selectedTags.indexOf(e.value),1);
    }
  }

  public copySelectedItems() {
    let wrapper = document.createElement('textarea');
    wrapper.readOnly = true;
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.opacity = '0';
    document.body.appendChild(wrapper);

    let content = this.prefix + this.selectedTags.join(' ' + this.prefix) + ' ' + this.prefix + 'photils';
    wrapper.value = content;
    wrapper.focus();

    if(this.deviceService.getDeviceInfo().device === 'iphone') {
      let range = document.createRange();
      let selection = window.getSelection();

      range.selectNodeContents(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);
      wrapper.setSelectionRange(0, 999999);
    } else {
      wrapper.select();
    }
    document.execCommand('copy');
    document.body.removeChild(wrapper);
    this.snackBar.open('Copied tags to clipboard.', "", { duration: 5000, panelClass: 'success'});
  }

  private handleFile(file:File) {
    if(file.type.startsWith("image")) {
      this.message = "Predicting ...";
      this.tags = [];
      this.selectedTags = [];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.showImage = true;
        const raw = reader.result;
        let urlCreator = window.URL || window.webkitURL;
        let url = urlCreator.createObjectURL( new Blob( [raw], { type: file.type } ));
        (this.srcImage.nativeElement as any).src = url;
        (this.srcImage.nativeElement as any).onload = async () => {
          let data =  await this.resizeImage(this.srcImage.nativeElement, 256, 256);

          if(this.legacy) {
            this.predictLegacy(data.base64);
          } else {
            let preprocessed = this.preprocess(data.imageData);
            this.predict(preprocessed);
          }
        }
      }

      reader.onerror = (e) => {
        this.snackBar.open("Error: " + e, "", { duration: 5000, panelClass: 'error'})
        this.message = undefined;
      }
      reader.readAsArrayBuffer(file);
    }
  }

  private async predict(data:tf.Tensor3D) {
    try {
      const prediction = this.model.predict(data) as tf.Tensor2D;
      const featureMap = prediction.dot(this.pcaTensor).flatten().dataSync();
      const feature = Object.keys(featureMap).map((key) => featureMap[key]);
      this.message = "lookup for available tags";
      let resp:any = await this.http.post('https://api.photils.app/tags', {feature: feature}).toPromise()
      if (resp.success) {
        this.tags = resp.tags.map((v) => { return {name: v}} );
      } else {
        throw Error(resp.message);
      }
    } catch(e) {
      this.snackBar.open("Error: " + e.message, "", { duration: 5000, panelClass: 'error'})
    } finally {
      this.message = undefined;
    }
  }

  private async predictLegacy(base64:string) {
    try {
      this.message = "lookup for available tags";
      let resp:any = await this.http.post('https://api.photils.app/tags', {image: base64}).toPromise()
      if (resp.success) {
        this.tags = resp.tags.map((v) => { return {name: v}} );
      } else {
        throw Error(resp.message);
      }
    } catch(e) {
      this.snackBar.open("Error: " + e.message, "", { duration: 5000, panelClass: 'error'})
    } finally {
      this.message = undefined;
    }
  }

  private resizeImage(img, width, height) : Promise<{imageData: ImageData, blob: Blob, base64:string}> {
    return new Promise<{imageData: ImageData, blob: Blob, base64:string}>((resolve, reject) => {
      try {
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let imageData = ctx.getImageData(0, 0, width, height);
        canvas.toBlob(blob => {
          resolve({imageData: imageData, blob: blob, base64: canvas.toDataURL().replace('data:image/png;base64,','')});
        });
      } catch(e) { reject(e) };
    })
  }

  private preprocess(imageData:ImageData) : tf.Tensor3D {
    let x = tf.fromPixels(imageData).asType('float32');
    let means = tf.tensor3d([103.939, 116.779, 123.68], [1, 1, 3])
    x = tf.reverse(x, -1);
    x = tf.sub(x, means);
    x = tf.expandDims(x);
    return x
  }

  public openLegacyDialog() {
    const dialogRef = this.dialog.open(DialogContentLegacy);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}

@Component({
  selector: 'dialog-content-legacy',
  templateUrl: 'dialog-content-legacy.html',
})
export class DialogContentLegacy {}