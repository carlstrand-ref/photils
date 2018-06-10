import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AppServics } from './app-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title:String = 'app';
  public isRoot = true;

  constructor(
    private router: Router, 
    private activeRoute: ActivatedRoute,
    private appService: AppServics
  ){                
    router.events.subscribe((e) => {
      if(e instanceof NavigationEnd) {
        this.isRoot = e.url === '/';   
      }
    });

    this.appService.title.subscribe((t) => {
      //this.title = t;
    });    
  }

  public setTitle(title:String) {
    this.title = title;
  }

  public goBack() {
    this.router.navigateByUrl('/');
  }

  ngOnInit() {
    
  }

}
