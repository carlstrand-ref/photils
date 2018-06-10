import { Injectable, Output, EventEmitter  } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppServics {  
  private titleChanged = new BehaviorSubject<String>("");
  public title = this.titleChanged.asObservable();

  constructor() { }

  public setTitle(title:String) {
    this.titleChanged.next(title);
  }
}
