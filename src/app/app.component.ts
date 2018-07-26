import { Component, OnInit } from '@angular/core';
import { routerTransition } from './router.animations';
import { AppUpdateService } from './app-update.service';

@Component({
  selector: 'app-root',
  animations: [ routerTransition ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private updateService: AppUpdateService) {}

  getState(outlet) {
    return outlet.activatedRouteData.state;
  }

}
