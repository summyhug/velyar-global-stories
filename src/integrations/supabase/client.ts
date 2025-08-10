import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import type { Database } from './types';

const SUPABASE_URL = "https://wgnjrvgjfoumqnlxzmgo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbmpydmdqZm91bXFubHh6bWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjAzNTYsImV4cCI6MjA2OTE5NjM1Nn0.fdT3BxoxHmHsxZjfNHQmvmHXbaBlUgfTXLyGBvG-RFM";

// Create storage adapter for Capacitor
const createCapacitorStorage = () => {
  return {
    getItem: (key: string) => {
      return new Promise<string | null>((resolve) => {
        if (Capacitor.isNativePlatform()) {
          // Use localStorage as fallback for now
          resolve(localStorage.getItem(key));
        } else {
          resolve(localStorage.getItem(key));
        }
      });
    },
    setItem: (key: string, value: string) => {
      return new Promise<void>((resolve) => {
        if (Capacitor.isNativePlatform()) {
          // Use localStorage as fallback for now
          localStorage.setItem(key, value);
        } else {
          localStorage.setItem(key, value);
        }
        resolve();
      });
    },
    removeItem: (key: string) => {
      return new Promise<void>((resolve) => {
        if (Capacitor.isNativePlatform()) {
          // Use localStorage as fallback for now
          localStorage.removeItem(key);
        } else {
          localStorage.removeItem(key);
        }
        resolve();
      });
    },
  };
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: Capacitor.isNativePlatform() ? createCapacitorStorage() : localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Function to clear all authentication data (useful for SDK distribution)
export const clearAuthData = () => {
  // Clear Supabase session
  supabase.auth.signOut({ scope: 'global' });
  
  // Clear localStorage items that might contain auth data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Force page reload to ensure clean state
  window.location.reload();
};