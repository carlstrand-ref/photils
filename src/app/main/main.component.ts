import { Component, OnInit } from '@angular/core';
import { isDevMode } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  private isDevMode: boolean = isDevMode()
  constructor() { }

  ngOnInit() {
  }

}
