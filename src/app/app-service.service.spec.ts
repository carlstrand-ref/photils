import { TestBed, inject } from '@angular/core/testing';

import { AppServics } from './app-service.service';

describe('AppServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppServics]
    });
  });

  it('should be created', inject([AppServics], (service: AppServics) => {
    expect(service).toBeTruthy();
  }));
});
