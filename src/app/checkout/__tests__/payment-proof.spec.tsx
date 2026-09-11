import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';

import type { PaymentInstructionsResult } from '@/core/models/checkout.model';
import type { PaymentProofSubmission } from '@/stores/checkout-store';

import PaymentProofScreen from '../payment-proof';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockedPicker = DocumentPicker as unknown as { getDocumentAsync: jest.Mock };
const mockedImagePicker = ImagePicker as unknown as {
  requestCameraPermissionsAsync: jest.Mock;
  requestMediaLibraryPermissionsAsync: jest.Mock;
  launchCameraAsync: jest.Mock;
  launchImageLibraryAsync: jest.Mock;
};

interface MockCheckoutState {
  paymentInstructions: PaymentInstructionsResult | null;
  lastCustomerEmail: string | null;
  proof: PaymentProofSubmission;
  submitProof: jest.Mock;
}

const mockSubmitProof = jest.fn().mockResolvedValue(true);
let mockState: MockCheckoutState;

jest.mock('@/stores/checkout-store', () => ({
  useCheckoutStore: (selector: (s: MockCheckoutState) => unknown) => selector(mockState),
}));

const pickedPdf = {
  canceled: false,
  assets: [
    {
      name: 'comprobante.pdf',
      uri: 'file:///tmp/comprobante.pdf',
      size: 1048576,
      mimeType: 'application/pdf',
      lastModified: 1,
    },
  ],
};

const expectedAsset = {
  uri: 'file:///tmp/comprobante.pdf',
  name: 'comprobante.pdf',
  type: 'application/pdf',
  size: 1048576,
};

function baseState(overrides: Partial<MockCheckoutState> = {}): MockCheckoutState {
  return {
    paymentInstructions: { orderNumber: 'ORD-1' } as PaymentInstructionsResult,
    lastCustomerEmail: 'ada@example.com',
    proof: { status: 'idle', error: null, url: null },
    submitProof: mockSubmitProof,
    ...overrides,
  };
}

describe('PaymentProofScreen — M3.5 comprobante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockState = baseState();
  });

  it('AC1: seleccionar un archivo muestra su nombre y tamaño', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce(pickedPdf);
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-pick'));

    await waitFor(() => expect(screen.getByTestId('payment-proof-file-name')).toBeTruthy());
    expect(screen.getByTestId('payment-proof-file-name').props.children).toBe('comprobante.pdf');
    expect(screen.getByTestId('payment-proof-file-size').props.children).toBe('1.0 MB');
  });

  it('AC1: enviar llama submitProof con orderNumber, email y asset', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce(pickedPdf);
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-pick'));
    await waitFor(() => expect(screen.getByTestId('payment-proof-submit')).toBeTruthy());

    fireEvent.press(screen.getByTestId('payment-proof-submit'));

    expect(mockSubmitProof).toHaveBeenCalledWith('ORD-1', 'ada@example.com', expectedAsset);
  });

  it('AC2: muestra el error inline que expone el store', () => {
    mockState = baseState({
      proof: { status: 'error', error: 'El archivo supera el máximo de 8 MB.', url: null },
    });
    render(<PaymentProofScreen />);

    expect(screen.getByTestId('payment-proof-error').props.children).toBe(
      'El archivo supera el máximo de 8 MB.',
    );
  });

  it('AC4: estado de error ofrece reintentar con el archivo seleccionado', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce(pickedPdf);
    mockState = baseState({
      proof: { status: 'error', error: 'Este pedido no acepta comprobantes.', url: null },
    });
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-pick'));
    await waitFor(() => expect(screen.getByTestId('payment-proof-retry')).toBeTruthy());

    fireEvent.press(screen.getByTestId('payment-proof-retry'));

    expect(mockSubmitProof).toHaveBeenCalledWith('ORD-1', 'ada@example.com', expectedAsset);
  });

  it('AC3: tras el éxito muestra la confirmación y no el formulario', () => {
    mockState = baseState({
      proof: { status: 'success', error: null, url: 'https://cdn.test/proof.pdf' },
    });
    render(<PaymentProofScreen />);

    expect(screen.getByTestId('payment-proof-success')).toBeTruthy();
    expect(screen.queryByTestId('payment-proof-submit')).toBeNull();
  });

  it('AC1 (#21): la cámara adjunta una foto con nombre, tipo y tamaño', async () => {
    mockedImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: true });
    mockedImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///tmp/foto.jpg',
          fileName: 'foto.jpg',
          mimeType: 'image/jpeg',
          fileSize: 2048,
          width: 10,
          height: 10,
        },
      ],
    });
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-camera'));

    await waitFor(() => expect(screen.getByTestId('payment-proof-file-name')).toBeTruthy());
    expect(screen.getByTestId('payment-proof-file-name').props.children).toBe('foto.jpg');
    expect(screen.getByTestId('payment-proof-file-size').props.children).toBe('2.0 KB');
  });

  it('AC1 (#21): la galería adjunta una imagen', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: true });
    mockedImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///tmp/galeria.png',
          fileName: 'galeria.png',
          mimeType: 'image/png',
          fileSize: 1024,
          width: 10,
          height: 10,
        },
      ],
    });
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-gallery'));

    await waitFor(() => expect(screen.getByTestId('payment-proof-file-name')).toBeTruthy());
    expect(screen.getByTestId('payment-proof-file-name').props.children).toBe('galeria.png');
  });

  it('AC1 (#21): permiso de cámara denegado no selecciona ni falla', async () => {
    mockedImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-camera'));

    await waitFor(() =>
      expect(mockedImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled(),
    );
    expect(mockedImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(screen.queryByTestId('payment-proof-file-name')).toBeNull();
    expect(screen.queryByTestId('payment-proof-error')).toBeNull();
    expect(mockSubmitProof).not.toHaveBeenCalled();
  });

  it('AC5: cancelar el picker no selecciona archivo ni muestra error', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-pick'));

    await waitFor(() => expect(mockedPicker.getDocumentAsync).toHaveBeenCalled());
    expect(screen.queryByTestId('payment-proof-file-name')).toBeNull();
    expect(screen.queryByTestId('payment-proof-error')).toBeNull();
    expect(mockSubmitProof).not.toHaveBeenCalled();
  });

  it('el submit está deshabilitado hasta elegir un archivo', () => {
    render(<PaymentProofScreen />);

    const submit = screen.getByTestId('payment-proof-submit');
    expect(submit.props.accessibilityState?.disabled).toBe(true);
  });

  it('usa orderNumber/email de los params cuando están presentes', async () => {
    mockParams = { orderNumber: 'ORD-9', email: 'otra@example.com' };
    mockedPicker.getDocumentAsync.mockResolvedValueOnce(pickedPdf);
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-pick'));
    await waitFor(() => expect(screen.getByTestId('payment-proof-submit')).toBeTruthy());

    fireEvent.press(screen.getByTestId('payment-proof-submit'));

    expect(mockSubmitProof).toHaveBeenCalledWith('ORD-9', 'otra@example.com', expectedAsset);
  });

  it('sin orderNumber/email muestra estado vacío', () => {
    mockState = baseState({ paymentInstructions: null, lastCustomerEmail: null });
    render(<PaymentProofScreen />);

    expect(screen.getByTestId('payment-proof-empty')).toBeTruthy();
  });

  it('el botón de éxito vuelve atrás', () => {
    mockState = baseState({
      proof: { status: 'success', error: null, url: null },
    });
    render(<PaymentProofScreen />);

    fireEvent.press(screen.getByTestId('payment-proof-back'));

    expect(mockBack).toHaveBeenCalled();
  });
});
