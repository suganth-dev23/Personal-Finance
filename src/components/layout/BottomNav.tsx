import React from 'react';
import { MobileNav } from './MobileNav';

export interface BottomNavProps {
  onOpenMore: () => void;
  onOpenAddTx: () => void;
  isMoreOpen?: boolean;
}

/**
 * Bottom Navigation Component (alias for MobileNav with enhanced aria support)
 */
export const BottomNav: React.FC<BottomNavProps> = (props) => {
  return <MobileNav {...props} />;
};

export default BottomNav;
