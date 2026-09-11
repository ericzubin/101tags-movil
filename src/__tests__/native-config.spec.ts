import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const APP_JSON_PATH = path.join(ROOT, 'app.json');
const GITIGNORE_PATH = path.join(ROOT, '.gitignore');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');

type CollectedDataType = {
  NSPrivacyCollectedDataType: string;
  NSPrivacyCollectedDataTypeLinked: boolean;
  NSPrivacyCollectedDataTypeTracking: boolean;
  NSPrivacyCollectedDataTypePurposes: string[];
};

type PrivacyManifests = {
  NSPrivacyTracking?: boolean;
  NSPrivacyTrackingDomains?: string[];
  NSPrivacyCollectedDataTypes?: CollectedDataType[];
};

type AppConfig = {
  expo: {
    android?: { permissions?: string[] };
    ios?: {
      infoPlist?: Record<string, unknown>;
      privacyManifests?: PrivacyManifests;
    };
    plugins?: (string | [string, unknown])[];
  };
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

const appConfig = readJson<AppConfig>(APP_JSON_PATH);
const appJsonRaw = fs.readFileSync(APP_JSON_PATH, 'utf8');
const gitignore = fs.readFileSync(GITIGNORE_PATH, 'utf8');
const packageJson = readJson<{ dependencies?: Record<string, string> }>(PACKAGE_JSON_PATH);

const FORBIDDEN_ANDROID_PERMISSIONS = [
  'android.permission.CAMERA',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.RECORD_AUDIO',
];

const FORBIDDEN_IOS_USAGE_KEYS = [
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSMicrophoneUsageDescription',
];

const FORBIDDEN_MEDIA_DEPENDENCIES = [
  'expo-camera',
  'expo-image-picker',
  'expo-media-library',
];

const REQUIRED_NATIVE_DEPENDENCIES = [
  'expo-clipboard',
  'expo-constants',
  'expo-document-picker',
  'expo-font',
  'expo-image',
  'expo-linking',
  'expo-secure-store',
  'expo-splash-screen',
  'expo-status-bar',
  'expo-system-ui',
];

const REQUIRED_PLUGINS = [
  'expo-router',
  'expo-secure-store',
  'expo-font',
  'expo-splash-screen',
  'expo-build-properties',
  'expo-image',
];

const EXPECTED_COLLECTED_DATA_TYPES = [
  'NSPrivacyCollectedDataTypeName',
  'NSPrivacyCollectedDataTypeEmailAddress',
  'NSPrivacyCollectedDataTypePhoneNumber',
];

const CREDENTIAL_GITIGNORE_PATTERNS = [
  '*.keystore',
  '*.jks',
  '*.p12',
  '*.mobileprovision',
  '*.cer',
  '*.p8',
  'keystore.properties',
  'credentials.json',
  '.env*',
];

const TRACKED_CREDENTIAL_PATTERN =
  /(\.keystore|\.jks|\.p12|\.mobileprovision|\.cer|\.p8)$|(^|\/)credentials\.json$/;

function pluginNames(): string[] {
  return (appConfig.expo.plugins ?? []).map((plugin) =>
    Array.isArray(plugin) ? plugin[0] : plugin,
  );
}

describe('native config — privacy manifest + minimal permissions (M7.1 #32)', () => {
  it('AC1: does not declare camera, photo-library or storage Android permissions', () => {
    const permissions = appConfig.expo.android?.permissions ?? [];
    for (const forbidden of FORBIDDEN_ANDROID_PERMISSIONS) {
      expect(permissions).not.toContain(forbidden);
    }
  });

  it('AC2: does not declare camera, photo-library or microphone iOS usage descriptions', () => {
    for (const key of FORBIDDEN_IOS_USAGE_KEYS) {
      expect(appConfig.expo.ios?.infoPlist ?? {}).not.toHaveProperty(key);
      expect(appJsonRaw).not.toContain(key);
    }
  });

  it('AC3: does not depend on unused media/camera modules', () => {
    for (const forbidden of FORBIDDEN_MEDIA_DEPENDENCIES) {
      expect(packageJson.dependencies ?? {}).not.toHaveProperty(forbidden);
    }
  });

  it('AC4: declares the native modules actually used', () => {
    for (const dependency of REQUIRED_NATIVE_DEPENDENCIES) {
      expect(packageJson.dependencies ?? {}).toHaveProperty(dependency);
    }
  });

  it('AC5: keeps the config plugins the app relies on', () => {
    expect(pluginNames()).toEqual(expect.arrayContaining(REQUIRED_PLUGINS));
  });

  it('AC6: declares an iOS privacy manifest without tracking', () => {
    const manifest = appConfig.expo.ios?.privacyManifests;
    expect(manifest).toBeDefined();
    expect(manifest?.NSPrivacyTracking).toBe(false);
    expect(manifest?.NSPrivacyTrackingDomains ?? []).toEqual([]);
  });

  it('AC7: declares only the account data actually collected', () => {
    const collected = appConfig.expo.ios?.privacyManifests?.NSPrivacyCollectedDataTypes ?? [];
    const declared = collected.map((entry) => entry.NSPrivacyCollectedDataType).sort();
    expect(declared).toEqual([...EXPECTED_COLLECTED_DATA_TYPES].sort());

    for (const entry of collected) {
      expect(entry.NSPrivacyCollectedDataTypeLinked).toBe(true);
      expect(entry.NSPrivacyCollectedDataTypeTracking).toBe(false);
      expect(entry.NSPrivacyCollectedDataTypePurposes).toEqual([
        'NSPrivacyCollectedDataTypePurposeAppFunctionality',
      ]);
    }
  });

  it('AC8: .gitignore covers signing credentials and local env files', () => {
    const lines = gitignore.split('\n').map((line) => line.trim());
    for (const pattern of CREDENTIAL_GITIGNORE_PATTERNS) {
      expect(lines).toContain(pattern);
    }
  });

  it('AC9: no signing credentials are tracked by git', () => {
    const tracked = execFileSync('git', ['ls-files'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((file) => file.length > 0);
    const offenders = tracked.filter((file) => TRACKED_CREDENTIAL_PATTERN.test(file));
    expect(offenders).toEqual([]);
  });
});
