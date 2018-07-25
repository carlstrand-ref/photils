import { Component, OnInit } from '@angular/core';
import { VERSION } from '../../environments/version';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  public version = VERSION
  constructor() { }

  ngOnInit() {
  }

}
