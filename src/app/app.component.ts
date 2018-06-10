import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  public isRoot = true;

  constructor(private router: Router, private activeRoute: ActivatedRoute){            
    console.log(router);
    router.events.subscribe((e) => {
      if(e instanceof NavigationEnd) {
        this.isRoot = e.url === '/';   
      }
    })
  }

  public goBack() {
    this.router.navigateByUrl('/');
  }

}
