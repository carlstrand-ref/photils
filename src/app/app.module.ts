import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatSelectModule, } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatCardModule, MatDividerModule, MatFormFieldModule, MatInputModule } from '@angular/material';

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
    MatInputModule,
    MatDividerModule,
    BrowserModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
