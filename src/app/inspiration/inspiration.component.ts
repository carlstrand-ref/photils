import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ArSphereComponent } from '../ar-sphere/ar-sphere.component';

@Component({
  selector: 'app-inspiration',
  templateUrl: './inspiration.component.html',
  styleUrls: ['./inspiration.component.css']
})
export class InspirationComponent implements OnInit {

  constructor(private location: Location) { }

  ngOnInit() {
  }

}
