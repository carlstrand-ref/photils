import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoTaggerComponent } from './auto-tagger.component';

describe('AutoTaggerComponent', () => {
  let component: AutoTaggerComponent;
  let fixture: ComponentFixture<AutoTaggerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoTaggerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoTaggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
