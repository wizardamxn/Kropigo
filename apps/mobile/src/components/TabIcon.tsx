import type { ReactElement } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type TabIconName = keyof typeof Ionicons.glyphMap;
type IconRenderer = (props: { color: string; size: number }) => ReactElement;

// Module-scope factory: each call happens once (at file load, from the
// constants below), producing a component whose identity never changes
// across renders. Passing a fresh inline arrow as `tabBarIcon` instead makes
// @react-navigation/bottom-tabs think options change every render, which can
// spiral into "Maximum update depth exceeded".
export function makeTabIcon(name: TabIconName): IconRenderer {
  return function TabIconRenderer({ color, size }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}
