import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainComponent } from './main/main.component';
import { DofComponent } from './dof/dof.component';
import { ExposureComponent } from './exposure/exposure.component';

const routes: Routes = [  
  { path: '', component: MainComponent, data: { state: 'main' } },
  { path: 'dof', component: DofComponent , data: { state: 'dof' }},
  { path: 'exposure', component: ExposureComponent , data: { state: 'exposure' }}
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: false }),
  ],
  exports: [RouterModule],
  declarations: []
})
export class AppRoutingModule { }
