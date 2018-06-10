import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MatCardModule, MatDividerModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatSelectModule, } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DofComponent } from './dof/dof.component';
import { ExposureComponent } from './exposure/exposure.component';

@NgModule({
  declarations: [
    AppComponent,
    DofComponent,
    ExposureComponent
  ],
  imports: [
    MatDividerModule,
    BrowserModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
