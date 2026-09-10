import { render, screen } from '@testing-library/react-native';
import React from 'react';

import CartTab from '../cart';

describe('CartTab — placeholder smoke (M1.10 AC6)', () => {
  it('renders the placeholder title "Carrito"', () => {
    render(<CartTab />);
    expect(screen.getByText('Carrito')).toBeTruthy();
  });

  it('renders the "Próximamente — Fase 3" subtitle', () => {
    render(<CartTab />);
    expect(screen.getByText('Próximamente — Fase 3')).toBeTruthy();
  });
});
