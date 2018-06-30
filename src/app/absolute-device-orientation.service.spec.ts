import { TestBed, inject } from '@angular/core/testing';

import { AbsoluteDeviceOrientationService } from './absolute-device-orientation.service';

describe('AbsoluteDeviceOrientationServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AbsoluteDeviceOrientationService]
    });
  });

  it('should be created', inject([AbsoluteDeviceOrientationService], (service: AbsoluteDeviceOrientationService) => {
    expect(service).toBeTruthy();
  }));
});
