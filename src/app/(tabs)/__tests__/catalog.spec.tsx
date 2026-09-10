import { render, screen } from '@testing-library/react-native';
import React from 'react';

import CatalogTab from '../catalog';

describe('CatalogTab — placeholder smoke (M1.10 AC6)', () => {
  it('renders the placeholder title "Catálogo"', () => {
    render(<CatalogTab />);
    expect(screen.getByText('Catálogo')).toBeTruthy();
  });

  it('renders the "Próximamente — Fase 2" subtitle', () => {
    render(<CatalogTab />);
    expect(screen.getByText('Próximamente — Fase 2')).toBeTruthy();
  });
});
