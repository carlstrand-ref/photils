import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatSelectModule } from '@angular/material/select';
import { 
  MatCardModule, 
  MatDividerModule, 
  MatFormFieldModule, 
  MatInputModule, 
  MatGridListModule, 
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatSlideToggleModule
} from '@angular/material';

import { AppComponent } from './app.component';
import { DofComponent } from './dof/dof.component';
import { ExposureComponent } from './exposure/exposure.component';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './/app-routing.module';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';

@NgModule({
  declarations: [
    AppComponent,
    DofComponent,
    ExposureComponent,
    MainComponent
  ],
  imports: [      
    BrowserAnimationsModule,  
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    CommonModule,
    MatInputModule,
    MatDividerModule,        
    BrowserModule,
    FormsModule,
    MatDividerModule,
    MatGridListModule,
    MatCardModule,
    MatSelectModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    FlexLayoutModule,
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
