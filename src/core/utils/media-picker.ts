import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

/**
 * Shared media picking for camera / gallery / file document flows (#21, #27).
 *
 * The pickers only return the raw asset; format/size validation lives in the
 * domain models (`paymentProofAssetError`, `isAllowedAttachment`). Every
 * function resolves `null` when the user cancels or denies the permission, so
 * callers can treat "no selection" as a no-op.
 */
export interface PickedFile {
  readonly uri: string;
  readonly name: string;
  readonly type: string | null;
  readonly size: number | null;
}

/** Images + PDF, mirroring the backend `mimes` for proofs/attachments. */
export const PICKER_DOCUMENT_TYPES = ['image/*', 'application/pdf'] as const;

function nameFromUri(uri: string): string {
  const withoutQuery = uri.split('?')[0];
  const segment = withoutQuery.split('/').pop();
  return segment && segment.length > 0 ? segment : 'archivo';
}

function fromImageAsset(asset: ImagePicker.ImagePickerAsset): PickedFile {
  return {
    uri: asset.uri,
    name: asset.fileName ?? nameFromUri(asset.uri),
    type: asset.mimeType ?? null,
    size: asset.fileSize ?? null,
  };
}

/** Camera photo (images only). `null` on cancel or denied permission. */
export async function pickImageFromCamera(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;
  return fromImageAsset(result.assets[0]);
}

/** Gallery image. `null` on cancel or denied permission. */
export async function pickImageFromLibrary(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;
  return fromImageAsset(result.assets[0]);
}

/** File document picker (default: images + PDF). `null` on cancel. */
export async function pickDocument(
  type: string[] = [...PICKER_DOCUMENT_TYPES],
): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;

  const picked = result.assets[0];
  return {
    uri: picked.uri,
    name: picked.name,
    type: picked.mimeType ?? null,
    size: picked.size ?? null,
  };
}
