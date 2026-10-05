import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Car,
  ShoppingCart,
  Zap,
  Film,
  Activity,
  Home,
  TrendingUp,
  Plane,
  Briefcase,
  Sparkles,
  Gift,
  Compass,
  Laptop,
  Building2,
  GraduationCap,
  Coffee,
  Fuel,
  Wifi,
  Smartphone,
  Tv,
  Heart,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  CreditCard,
  Landmark,
  CircleDollarSign,
  Tag,
  PieChart,
  Award,
  Target,
  Trophy,
  Shield,
  Crown,
  Layers,
  Gem,
  Flame,
  Receipt,
  CheckCircle2,
  Users,
  CloudUpload,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  ShoppingBag,
  Car,
  ShoppingCart,
  Zap,
  Film,
  Activity,
  Home,
  TrendingUp,
  Plane,
  Briefcase,
  Sparkles,
  Gift,
  Compass,
  Laptop,
  Building2,
  GraduationCap,
  Coffee,
  Fuel,
  Wifi,
  Smartphone,
  Tv,
  Heart,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  CreditCard,
  Landmark,
  CircleDollarSign,
  Tag,
  PieChart,
  Award,
  Target,
  Trophy,
  Shield,
  Crown,
  Layers,
  Gem,
  Flame,
  Receipt,
  CheckCircle2,
  Users,
  CloudUpload,
};

const NORMALIZED_ICON_MAP = new Map<string, React.ElementType>();
for (const [key, comp] of Object.entries(ICON_MAP)) {
  NORMALIZED_ICON_MAP.set(key.toLowerCase(), comp);
  NORMALIZED_ICON_MAP.set(key.toLowerCase().replace(/[-_ ]/g, ''), comp);
}

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

function getIconComponent(name: string): React.ElementType {
  if (typeof name === 'string' && name.trim()) {
    const clean = name.trim();
    if (ICON_MAP[clean]) {
      return ICON_MAP[clean];
    }
    const pascal = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (ICON_MAP[pascal]) {
      return ICON_MAP[pascal];
    }
    const lowerKey = clean.toLowerCase();
    const strippedKey = lowerKey.replace(/[-_ ]/g, '');
    const found = NORMALIZED_ICON_MAP.get(lowerKey) || NORMALIZED_ICON_MAP.get(strippedKey);
    if (found) {
      return found;
    }
  }
  return Tag;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size }) => {
  return React.createElement(getIconComponent(name), { className, size });
};
