"use client";

import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Users, Dumbbell, Calendar, BarChart3, FlaskConical, Settings } from "lucide-react";

const gymNavItems = [
  { title: "Dashboard", href: "/admin-gym", icon: LayoutDashboard },
  { title: "Clientes", href: "/admin-gym/clientes", icon: Users },
  { title: "Ejercicios", href: "/admin-gym/ejercicios", icon: Dumbbell },
  { title: "Clases", href: "/admin-gym/clases", icon: Calendar },
  { title: "Estadísticas", href: "/admin-gym/estadisticas", icon: BarChart3 },
  { title: "Testing Lab", href: "/admin-gym/testing", icon: FlaskConical },
  { title: "Configuración", href: "/admin-gym/configuracion", icon: Settings },
];

export function AdminGymHeader() {
  return null;
}
