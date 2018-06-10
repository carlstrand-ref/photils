import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DofComponent } from './dof.component';

describe('DofComponent', () => {
  let component: DofComponent;
  let fixture: ComponentFixture<DofComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DofComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DofComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
