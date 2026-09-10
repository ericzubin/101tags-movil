import { render } from '@testing-library/react-native';

import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('AC26: renderiza un Animated.View con background gris y dimensiones', () => {
    const { getByTestId } = render(<Skeleton testID="my-skel" />);
    const node = getByTestId('my-skel');
    expect(node).toBeTruthy();
    // Animated.View attaches its props to props.style — verify width/height/color exist
    const style = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.flat().filter(Boolean))
      : node.props.style;
    expect(style.width).toBe('100%');
    expect(style.height).toBe(16);
    expect(typeof style.backgroundColor).toBe('string');
  });

  it('acepta width/height custom y rounded=true aplica borderRadius alto', () => {
    const { getByTestId } = render(
      <Skeleton testID="pill-skel" width={120} height={40} rounded />,
    );
    const node = getByTestId('pill-skel');
    const style = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.flat().filter(Boolean))
      : node.props.style;
    expect(style.width).toBe(120);
    expect(style.height).toBe(40);
    // rounded → uses radii.pill (999) per design system
    expect(style.borderRadius).toBe(999);
  });
});
