import { Component, OnInit, HostListener} from '@angular/core';


@Component({
  selector: 'app-ar-sphere',
  templateUrl: './ar-sphere.component.html',
  styleUrls: ['./ar-sphere.component.css']
})
export class ArSphereComponent implements OnInit {
  public orientationSupported = false;
  @HostListener('window:deviceorientation', ["$event"]) handleOrientation(e) {    
    //console.log(e);  
    // values explained https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
    this.orientationSupported = true;
  }

  constructor() {
    
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
  }

}
