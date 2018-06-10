import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposureComponent } from './exposure.component';

describe('ExposureComponent', () => {
  let component: ExposureComponent;
  let fixture: ComponentFixture<ExposureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExposureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
