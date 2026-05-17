"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Preferences {
  weightUnit: string;
  distanceUnit: string;
  measurementUnit: string;
  refreshPreferences: () => Promise<void>;
}

const defaultPreferences: Preferences = {
  weightUnit: "kg",
  distanceUnit: "km",
  measurementUnit: "cm",
  refreshPreferences: async () => {},
};

const PreferencesContext = createContext<Preferences>(defaultPreferences);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [prefs, setPrefs] = useState({
    weightUnit: "kg",
    distanceUnit: "km",
    measurementUnit: "cm",
  });

  const refreshPreferences = async () => {
    try {
      const res = await fetch("/api/settings/units");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setPrefs({
            weightUnit: data.weightUnit || "kg",
            distanceUnit: data.distanceUnit || "km",
            measurementUnit: data.measurementUnit || "cm",
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing preferences:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      refreshPreferences();
    }
  }, [status]);

  return (
    <PreferencesContext.Provider value={{ ...prefs, refreshPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
