import { Component, OnInit, Injectable, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import KerasJS from 'keras-js';
import { imagenetClassesTopK } from './imagenet';
import ndarray from 'ndarray';
import ops from 'ndarray-ops';
import { MatSelectionList, MatTreeFlattener, MatTreeFlatDataSource, MatProgressSpinner } from '@angular/material';
import { Utils } from '../utils';
import {MatSnackBar} from '@angular/material';
import {TagDatabase, TagNode, TagFlatNode} from '../tags';
import { FlatTreeControl } from '@angular/cdk/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';

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
  public model:KerasJS.Model;
  public result: Array<{category: string, probability: number}>;
  public message:string;
  public prefix:string = "";

  flatNodeMap = new Map<TagFlatNode, TagNode>();
  nestedNodeMap = new Map<TagNode, TagFlatNode>();
  selectedParent: TagNode | null = null;

  treeControl: FlatTreeControl<TagFlatNode>;
  treeFlattener: MatTreeFlattener<TagNode, TagFlatNode>;
  dataSource: MatTreeFlatDataSource<TagNode, TagFlatNode>;
  tagListSelection = new SelectionModel<TagFlatNode>(true /* multiple */);

  getLevel = (node: TagFlatNode) => node.level;
  isExpandable = (node: TagFlatNode) => node.expandable;
  getChildren = (node: TagNode): Observable<Array<TagNode>> => {
    return new BehaviorSubject(node.children);
  };
  hasChild = (_: number, _nodeData: TagFlatNode) => _nodeData.expandable;
  hasNoContent = (_: number, _nodeData: TagFlatNode) => _nodeData.item === '';

  constructor(public snackBar: MatSnackBar, private tagDatabase:TagDatabase) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TagFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  ngOnInit() {
    (this.inputFile.nativeElement as any).addEventListener("change",(e) => {
      this.handleFile(e.target.files[0]);
    }, false);

    this.initModel();
  }

  private async initModel() {
    try {
      this.model = new KerasJS.Model({
        filepath: 'assets/model.bin',
        gpu: !Utils.isMobile // on mobile devices the results a wrong because of an error
      });

      this.message = "loading model ...";
      this.spinner.mode = "determinate";
      this.model.events.on('loadingProgress', (e) => this.handleLoadingProgress(e))
      this.model.events.on('initProgress', (e) => this.handleInitProgress(e))
      this.model.events.on('predictProgress', (e) => this.handlePredictProgress(e))


      await this.model.ready();
      this.spinner.mode = "indeterminate";
      this.message = undefined;
    } catch(e) {
      this.snackBar.open("Error: " + e.message, "", { duration: 2000, panelClass: 'error'})
    }
  }

  handleLoadingProgress(progress) {
    this.spinner.value = Math.round(progress);
    this.message = `Loading Model ${this.spinner.value} %`;
    if (progress === 100) {
      this.spinner.value = 0;
    }
  };

  handleInitProgress(progress) {
    this.spinner.value = Math.round(progress);
    this.message = `Initialize Model ${this.spinner.value} %`;
    this.spinner.value = progress;
    if (progress === 100) {

    }
  };

  handlePredictProgress(progress) {
    this.spinner.value = Math.round(progress);
    this.message = `Predicting tags: ${this.spinner.value} %`;
    this.spinner.value = progress;
    if (progress === 100) {

    }
  };

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

  public copySelectedItems() {
    let wrapper = document.createElement('textarea');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.opacity = '0';
    document.body.appendChild(wrapper);

    let content = this.tagListSelection.selected.map(node => this.prefix + node.item).join(' ');
    wrapper.value = content;
    wrapper.focus();
    wrapper.select();
    document.execCommand('copy');
    document.body.removeChild(wrapper);
    this.snackBar.open('Copied tags to clipboard.', "", { duration: 2000, panelClass: 'success'});
  }

  private handleFile(file:File) {
    if(file.type.startsWith("image")) {
      this.message = "Predicting ...";
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
      let tags = [];

      for(let label of labels) {
        const node = new TagNode(label.category);
        node.children = this.tagDatabase.getChildren(label.category === 'seashore' ? 'landscape' : 'seashore');
        tags.push(node)
      }

      this.dataSource.data = tags;
      this.result = labels;
      this.message = undefined;
    } catch(e) {
      this.snackBar.open("Error: " + e.message, "", { duration: 2000, panelClass: 'error'})
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

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TagNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
        ? existingNode
        : new TagFlatNode();

    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = !!node.children;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  tagSelectionToggle(node: TagFlatNode): void {
    console.log(node);
    this.tagListSelection.toggle(node);
  }

}
