import { describe, expect, it } from 'vitest';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { GoogleLogoIcon } from '@/components/ui/GoogleLogoIcon';

describe('GoogleSignInButton branding', () => {
  it('exports the Sign in with Google button component', () => {
    expect(GoogleSignInButton).toBeTypeOf('function');
  });

  it('exports the official multicolor Google G logo', () => {
    expect(GoogleLogoIcon).toBeTypeOf('function');
  });
});
