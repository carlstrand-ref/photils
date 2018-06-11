import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DofVisualizerComponent } from './dof-visualizer.component';

describe('DofVisualizerComponent', () => {
  let component: DofVisualizerComponent;
  let fixture: ComponentFixture<DofVisualizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DofVisualizerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DofVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
