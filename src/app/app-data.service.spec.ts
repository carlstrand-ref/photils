import { TestBed, inject } from '@angular/core/testing';

import { AppDataServics } from './app-data.service';

describe('AppServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppDataServics]
    });
  });

  it('should be created', inject([AppDataServics], (service: AppDataServics) => {
    expect(service).toBeTruthy();
  }));
});
