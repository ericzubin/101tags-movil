import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const APP_JSON_PATH = path.join(ROOT, 'app.json');
const EAS_JSON_PATH = path.join(ROOT, 'eas.json');
const RELEASE_CHECKLIST_PATH = path.join(ROOT, 'docs', 'release', 'RELEASE-CHECKLIST.md');

type EasConfig = {
  cli?: { version?: string; appVersionSource?: string };
  build?: Record<
    string,
    {
      developmentClient?: boolean;
      distribution?: string;
      android?: { buildType?: string };
      ios?: Record<string, unknown>;
    }
  >;
};

type AppConfig = {
  expo: {
    scheme?: string;
    version?: string;
    android?: { package?: string; versionCode?: number };
    ios?: { bundleIdentifier?: string; buildNumber?: string };
  };
};

const EXPECTED_APP_ID = 'mx.com.tags.movil';
const EXPECTED_VERSION = '1.0.0';
const EXPECTED_VERSION_CODE = 1;
const EXPECTED_BUILD_NUMBER = '1';
const EXPECTED_SCHEME = '101tags';

const CREDENTIAL_EXTENSIONS = ['.keystore', '.jks', '.p12', '.mobileprovision', '.cer', '.p8'];

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function readEasJson(): EasConfig {
  return readJson<EasConfig>(EAS_JSON_PATH);
}

function baseName(file: string): string {
  return file.split('/').pop() ?? file;
}

function isTrackedCredential(file: string): boolean {
  const base = baseName(file);
  if (CREDENTIAL_EXTENSIONS.some((extension) => base.endsWith(extension))) return true;
  if (base === 'credentials.json') return true;
  if (base === '.env') return true;
  if (base.startsWith('.env.') && base !== '.env.example') return true;
  return false;
}

describe('release config — eas.json + versiones definitivas (M7.2/M7.3/M7.5 #33 #34 #36)', () => {
  it('AC1: eas.json is valid JSON with cli + development/preview/production profiles', () => {
    const eas = readEasJson();
    expect(eas.cli).toBeDefined();
    expect(typeof eas.cli?.version).toBe('string');
    expect(eas.build).toBeDefined();
    for (const profile of ['development', 'preview', 'production']) {
      expect(eas.build).toHaveProperty(profile);
    }
  });

  it('AC2: development profile is a dev client with internal distribution', () => {
    const development = readEasJson().build?.development;
    expect(development?.developmentClient).toBe(true);
    expect(development?.distribution).toBe('internal');
  });

  it('AC3: preview profile builds an Android apk for internal distribution', () => {
    const preview = readEasJson().build?.preview;
    expect(preview?.distribution).toBe('internal');
    expect(preview?.android?.buildType).toBe('apk');
  });

  it('AC4: production profile builds an Android app-bundle for store', () => {
    const production = readEasJson().build?.production;
    expect(production?.android?.buildType).toBe('app-bundle');
    expect(production?.distribution ?? 'store').not.toBe('internal');
  });

  it('AC5: app.json declares the definitive version, versionCode and buildNumber', () => {
    const app = readJson<AppConfig>(APP_JSON_PATH);
    expect(app.expo.version).toBe(EXPECTED_VERSION);
    expect(app.expo.android?.versionCode).toBe(EXPECTED_VERSION_CODE);
    expect(app.expo.ios?.buildNumber).toBe(EXPECTED_BUILD_NUMBER);
  });

  it('AC6: app ids, scheme and bundle/package stay aligned', () => {
    const app = readJson<AppConfig>(APP_JSON_PATH);
    expect(app.expo.scheme).toBe(EXPECTED_SCHEME);
    expect(app.expo.ios?.bundleIdentifier).toBe(EXPECTED_APP_ID);
    expect(app.expo.android?.package).toBe(EXPECTED_APP_ID);
  });

  it('AC7: release checklist exists with version policy, ids and blocked criteria', () => {
    expect(fs.existsSync(RELEASE_CHECKLIST_PATH)).toBe(true);
    const checklist = fs.readFileSync(RELEASE_CHECKLIST_PATH, 'utf8');
    expect(checklist).toContain(EXPECTED_APP_ID);
    expect(checklist).toContain(EXPECTED_VERSION);
    expect(checklist).toContain(EXPECTED_SCHEME);
    expect(checklist).toMatch(/versionCode/);
    expect(checklist).toMatch(/buildNumber/);
    expect(checklist).toMatch(/BLOCKED/);
    expect(checklist).toMatch(/legal\/privacy/);
  });

  it('AC8: no signing credentials or real env files are tracked by git', () => {
    const tracked = execFileSync('git', ['ls-files'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((file) => file.length > 0);
    const offenders = tracked.filter(isTrackedCredential);
    expect(offenders).toEqual([]);
  });

  it('AC9: .env.example remains the only tracked env template (safe, no secrets)', () => {
    const tracked = execFileSync('git', ['ls-files'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((file) => file.length > 0);
    const envFiles = tracked.filter((file) => baseName(file).startsWith('.env'));
    expect(envFiles).toEqual(['.env.example']);
  });
});
