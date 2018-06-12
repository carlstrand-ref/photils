import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArSphereComponent } from './ar-sphere.component';

describe('ArSphereComponent', () => {
  let component: ArSphereComponent;
  let fixture: ComponentFixture<ArSphereComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArSphereComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArSphereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
