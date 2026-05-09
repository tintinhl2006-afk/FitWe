"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Preferences {
  weightUnit: string;
  distanceUnit: string;
}

const defaultPreferences: Preferences = {
  weightUnit: "kg",
  distanceUnit: "km",
};

const PreferencesContext = createContext<Preferences>(defaultPreferences);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [prefs, setPrefs] = useState({
    weightUnit: "kg",
    distanceUnit: "km",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/settings/units")
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setPrefs(prev => ({
              ...prev,
              weightUnit: data.weightUnit || "kg",
              distanceUnit: data.distanceUnit || "km",
            }));
          }
        })
        .catch(console.error);
    }
  }, [status]);

  return (
    <PreferencesContext.Provider value={prefs}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
