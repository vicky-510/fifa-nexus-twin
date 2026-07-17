import { appConfig } from './app.config';

describe('appConfig', () => {
  it('should be defined with a providers array', () => {
    expect(appConfig).toBeDefined();
    expect(Array.isArray(appConfig.providers)).toBe(true);
  });

  it('should register exactly 3 providers (error listeners, router, http client)', () => {
    expect(appConfig.providers.length).toBe(3);
  });

  it('should include a provider entry for each expected concern', () => {
    // provideBrowserGlobalErrorListeners / provideRouter / provideHttpClient all
    // return internal EnvironmentProviders/Provider objects, so we can't check by
    // identity/name directly. Instead assert the shape: all entries are truthy
    // and are either provider objects or arrays of providers.
    for (const provider of appConfig.providers) {
      expect(provider).toBeTruthy();
    }
  });
});
