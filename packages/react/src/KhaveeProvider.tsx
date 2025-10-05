"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { KhaveeConfig } from '@khaveeai/core';

interface KhaveeContextType {
  config: KhaveeConfig;
}

const KhaveeContext = createContext<KhaveeContextType | null>(null);

export interface KhaveeProviderProps {
  config: KhaveeConfig;
  children: ReactNode;
}

export function KhaveeProvider({ config, children }: KhaveeProviderProps) {
  return (
    <KhaveeContext.Provider value={{ config }}>
      {children}
    </KhaveeContext.Provider>
  );
}

export function useKhavee(): KhaveeContextType {
  const context = useContext(KhaveeContext);
  if (!context) {
    throw new Error('useKhavee must be used within a KhaveeProvider');
  }
  return context;
}