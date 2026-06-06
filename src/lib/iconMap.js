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
  // New icons for categories & SIP features
  Repeat, Scissors, Gift, ArrowLeftRight, Building,
  BellRing, CalendarCheck, Clock,
  Pizza, Coffee, Utensils, Tv, Film, Music, Ticket,
  Book, BookOpen, Library, ArrowDown, ArrowUp, Minus, Coins
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
  Repeat, Scissors, Gift, ArrowLeftRight, Building,
  BellRing, CalendarCheck, Clock,
  Pizza, Coffee, Utensils, Tv, Film, Music, Ticket,
  Book, BookOpen, Library, ArrowDown, ArrowUp, Minus, Coins
};

/**
 * Get a Lucide icon component by string name.
 * @param {string} name - Icon name (e.g., "Home", "PiggyBank")
 * @returns {React.Component} Lucide icon component, or Circle as fallback
 */
export function getIcon(name) {
  if (!name) return Circle;
  
  const fallbacks = {
    food: iconMap.UtensilsCrossed,
    rent: iconMap.Home,
    shopping: iconMap.ShoppingBag,
    travel: iconMap.Car,
    entertainment: iconMap.Gamepad2,
    utilities: iconMap.Zap,
    health: iconMap.Heart,
    education: iconMap.GraduationCap,
    investment: iconMap.TrendingUp,
    savings: iconMap.PiggyBank,
    expense: iconMap.ArrowDownRight,
    income: iconMap.ArrowUpRight,
    salary: iconMap.Briefcase,
  };
  
  return iconMap[name] || fallbacks[name.toLowerCase()] || Circle;
}

export default iconMap;
