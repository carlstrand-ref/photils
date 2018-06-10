import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MatCardModule } from '@angular/material';

import { AppComponent } from './app.component';
import { DofComponent } from './dof/dof.component';

@NgModule({
  declarations: [
    AppComponent,
    DofComponent
  ],
  imports: [
    BrowserModule,
    MatCardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
