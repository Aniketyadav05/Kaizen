/**
 * FinPilot — Icon Map
 * 
 * Maps icon name strings (from seedData/categories) to Lucide React components.
 * This allows categories and goals to reference icons by string name,
 * which can be stored in localStorage/JSON without importing components.
 */

import {
  Home, TrendingUp, Sparkles, Heart, PiggyBank,
  UtensilsCrossed, Car, ShoppingBag, Dumbbell, GraduationCap,
  Gamepad2, Zap, Smartphone, CreditCard, Banknote,
  Building2, Wallet, Globe, Briefcase, Laptop,
  Plus, Target, ShieldCheck, Plane, Sunset,
  Circle, ArrowUpRight, ArrowDownRight, TrendingDown,
  AlertTriangle, AlertOctagon, Gauge, Shield,
  BarChart3, Calendar, Edit3, Receipt, IndianRupee,
  Settings, ChartPie, Goal, Search, Filter,
  Download, Upload, Trash2, Copy, Pencil,
  X, Check, ChevronLeft, ChevronRight, ChevronDown,
  Moon, Sun, Monitor, Lock, Unlock,
  FileText, MoreVertical, Info, Bell, Eye, EyeOff,
} from "lucide-react";

const iconMap = {
  Home, TrendingUp, Sparkles, Heart, PiggyBank,
  UtensilsCrossed, Car, ShoppingBag, Dumbbell, GraduationCap,
  Gamepad2, Zap, Smartphone, CreditCard, Banknote,
  Building2, Wallet, Globe, Briefcase, Laptop,
  Plus, Target, ShieldCheck, Plane, Sunset,
  Circle, ArrowUpRight, ArrowDownRight, TrendingDown,
  AlertTriangle, AlertOctagon, Gauge, Shield,
  BarChart3, Calendar, Edit3, Receipt, IndianRupee,
  Settings, ChartPie, Goal, Search, Filter,
  Download, Upload, Trash2, Copy, Pencil,
  X, Check, ChevronLeft, ChevronRight, ChevronDown,
  Moon, Sun, Monitor, Lock, Unlock,
  FileText, MoreVertical, Info, Bell, Eye, EyeOff,
};

/**
 * Get a Lucide icon component by string name.
 * @param {string} name - Icon name (e.g., "Home", "PiggyBank")
 * @returns {React.Component} Lucide icon component, or Circle as fallback
 */
export function getIcon(name) {
  const fallbacks = {
    Food: iconMap.UtensilsCrossed,
    Rent: iconMap.Home,
    Shopping: iconMap.ShoppingBag,
    Travel: iconMap.Car,
    Entertainment: iconMap.Gamepad2,
    Utilities: iconMap.Zap,
    Health: iconMap.Heart,
    Education: iconMap.GraduationCap,
    Investment: iconMap.TrendingUp,
    Savings: iconMap.PiggyBank,
  };
  return iconMap[name] || fallbacks[name] || Circle;
}

export default iconMap;
