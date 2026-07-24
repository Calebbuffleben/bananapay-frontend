import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  it('allows only platform administrators', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { user: () => ({ role: 'PLATFORM_ADMIN' }) },
        },
        {
          provide: Router,
          useValue: { createUrlTree: jasmine.createSpy('createUrlTree') },
        },
      ],
    });

    const allowed = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never),
    );
    expect(allowed).toBeTrue();
  });
});
