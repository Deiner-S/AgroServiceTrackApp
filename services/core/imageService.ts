import {
  exceptionHandling,
  syncExceptionHandling,
} from '@/exceptions/ExceptionHandler';
import ImageServiceException from '@/exceptions/ImageServiceException';
import * as ImagePicker from 'expo-image-picker';

export function base64ToUint8Array(base64: string): Uint8Array {
  return syncExceptionHandling(() => {
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
    const binary = atob(cleanBase64);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }, { ExceptionType: ImageServiceException });
}

export async function readImageAsUint8Array(uri: string): Promise<Uint8Array> {
  return exceptionHandling(async () => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const buffer = reader.result as ArrayBuffer;
        resolve(new Uint8Array(buffer));
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }, { ExceptionType: ImageServiceException });
}

export async function takePhoto(): Promise<string | null> {
  return exceptionHandling(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      throw new ImageServiceException('CAMERA_PERMISSION_DENIED');
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (result.canceled) {
      return null;
    }

    return result.assets[0]?.uri ?? null;
  }, { ExceptionType: ImageServiceException });
}
