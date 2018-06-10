import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DofComponent } from './dof/dof.component';
import { ExposureComponent } from './exposure/exposure.component';

const routes: Routes = [
  { path: 'dof', component: DofComponent },
  { path: 'exposure', component: ExposureComponent }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { enableTracing: false }),
  ],
  exports: [RouterModule],
  declarations: []
})
export class AppRoutingModule { }
