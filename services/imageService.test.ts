import * as ImagePicker from 'expo-image-picker';
import { base64ToUint8Array, takePhoto } from './imageService';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

const mockRequestCameraPermissionsAsync = ImagePicker.requestCameraPermissionsAsync as jest.MockedFunction<typeof ImagePicker.requestCameraPermissionsAsync>;
const mockLaunchCameraAsync = ImagePicker.launchCameraAsync as jest.MockedFunction<typeof ImagePicker.launchCameraAsync>;

describe('imageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('converts base64 string to Uint8Array', () => {
    const result = base64ToUint8Array('data:image/png;base64,QQ==');

    expect(Array.from(result)).toEqual([65]);
  });

  it('returns photo uri when camera succeeds', async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true } as any);
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    } as any);

    await expect(takePhoto()).resolves.toBe('file://photo.jpg');
  });

  it('returns null when user cancels camera', async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true } as any);
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    } as any);

    await expect(takePhoto()).resolves.toBeNull();
  });

  it('throws when camera permission is denied', async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: false } as any);

    await expect(takePhoto()).rejects.toThrow('CAMERA_PERMISSION_DENIED');
  });
});
