export interface BioData {
  gender: "male" | "female";
  age: number;
  weight: number; // in kg
  height: number; // in cm
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
  goal: "LOSE" | "MAINTAIN" | "GAIN";
  aggressiveness: "SLOW" | "NORMAL" | "AGGRESSIVE";
}

export interface MetabolicTargets {
  targetCalories: number;
  targetProtein: number; // in g
  targetFat: number; // in g
  targetCarbs: number; // in g
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export function calculateMetabolicTargets(data: BioData): MetabolicTargets {
  // 1. Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor
  let bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age);
  if (data.gender === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 2. Calculate Total Daily Energy Expenditure (TDEE)
  const multiplier = ACTIVITY_MULTIPLIERS[data.activityLevel] || 1.2;
  const tdee = bmr * multiplier;

  // 3. Apply Goal Modifier
  let targetCalories = tdee;
  
  if (data.goal === "LOSE") {
    if (data.aggressiveness === "SLOW") targetCalories -= 300;
    else if (data.aggressiveness === "NORMAL") targetCalories -= 500;
    else if (data.aggressiveness === "AGGRESSIVE") targetCalories -= 700;
  } else if (data.goal === "GAIN") {
    if (data.aggressiveness === "SLOW") targetCalories += 300;
    else if (data.aggressiveness === "NORMAL") targetCalories += 500;
    else if (data.aggressiveness === "AGGRESSIVE") targetCalories += 700;
  }
  
  // Floor to avoid decimal calories
  targetCalories = Math.max(1200, Math.floor(targetCalories)); // Set a safe minimum of 1200 kcal

  // 4. Calculate Macros
  // Protein: 2.2g per kg of weight
  const targetProtein = Math.floor(data.weight * 2.2);
  const proteinCalories = targetProtein * 4;

  // Fat: 25% of total calories
  const fatCalories = targetCalories * 0.25;
  const targetFat = Math.floor(fatCalories / 9);

  // Carbs: Remaining calories
  const remainingCalories = targetCalories - (proteinCalories + fatCalories);
  const targetCarbs = Math.max(0, Math.floor(remainingCalories / 4));

  return {
    targetCalories,
    targetProtein,
    targetFat,
    targetCarbs,
  };
}
export function getFoodCategory(name: string): string {
  const lower = name.toLowerCase();
  
  // 1. Fats, Oils & Nuts (Grasas/Aceites/Frutos Secos) - Check first to catch "pipas de calabaza" before vegetable check
  if (lower.includes("aceite") || lower.includes("aguacate") || lower.includes("nuez") || lower.includes("nueces") || lower.includes("cacahuete") || lower.includes("cacahuetes") || lower.includes("almendra") || lower.includes("almendras") || lower.includes("fruto seco") || lower.includes("mantequilla") || lower.includes("oliva") || lower.includes("pistacho") || lower.includes("pistachos") || lower.includes("avellana") || lower.includes("avellanas") || lower.includes("margarina") || lower.includes("anacardo") || lower.includes("anacardos") || (lower.includes("piñones") && !lower.includes("champiñones")) || lower.includes("piñón") || lower.includes("pipas") || lower.includes("aceitunas") || lower.includes("aceituna") || lower.includes("mayonesa") || lower.includes("allioli") || lower.includes("chocolate") || lower.includes("crema de cacahuete") || lower.includes("bebida de almendra")) {
    return "Grasas/Aceites/Frutos Secos";
  }

  // 2. Vegetables (Verdura) - Check to avoid "repollo" matching "pollo"
  if (lower.includes("brócoli") || lower.includes("espinaca") || lower.includes("calabacín") || lower.includes("lechuga") || lower.includes("tomate") || lower.includes("verdura") || lower.includes("zanahoria") || lower.includes("pepino") || lower.includes("pimiento") || lower.includes("cebolla") || lower.includes("ajo") || lower.includes("judía verde") || lower.includes("judías verdes") || lower.includes("champiñón") || lower.includes("champiñones") || lower.includes("setas") || lower.includes("coliflor") || lower.includes("repollo") || lower.includes("espárrago") || lower.includes("espárragos") || lower.includes("berenjena") || lower.includes("acelga") || lower.includes("acelgas") || lower.includes("puerro") || lower.includes("calabaza") || lower.includes("apio") || lower.includes("rádano") || lower.includes("rábano") || lower.includes("alcachofa") || lower.includes("alcachofas") || lower.includes("canónigos") || lower.includes("rúcula") || lower.includes("piquillo") || lower.includes("bruselas") || lower.includes("lombarda") || lower.includes("remolacha") || lower.includes("grelos") || lower.includes("bimi") || lower.includes("gazpacho")) {
    return "Verdura";
  }
  
  // 3. Fish & Seafood (Pescado) - Check before general meat terms (lomo, filete)
  if (lower.includes("salmón") || lower.includes("atún") || lower.includes("merluza") || lower.includes("pescado") || lower.includes("bacalao") || lower.includes("sardina") || lower.includes("sardinas") || lower.includes("gamba") || lower.includes("gambas") || lower.includes("langostino") || lower.includes("langostinos") || lower.includes("marisco") || lower.includes("pulpo") || lower.includes("calamar") || lower.includes("calamares") || lower.includes("mejillón") || lower.includes("mejillones") || lower.includes("dorada") || lower.includes("lubina") || lower.includes("trucha") || lower.includes("lenguado") || lower.includes("boquerón") || lower.includes("boquerones") || lower.includes("sepia") || lower.includes("almeja") || lower.includes("almejas") || lower.includes("bonito") || lower.includes("caballa") || lower.includes("emperador") || lower.includes("pez espada") || lower.includes("berberechos") || lower.includes("navajas") || lower.includes("gulas") || lower.includes("cigalas") || lower.includes("chipirones")) {
    return "Pescado";
  }
  
  // 4. Meat (Carne)
  if (lower.includes("pollo") || lower.includes("pavo") || lower.includes("ternera") || lower.includes("buey") || lower.includes("cerdo") || lower.includes("lomo") || lower.includes("carne") || lower.includes("jamón") || lower.includes("filete") || lower.includes("hamburguesa") || lower.includes("conejo") || lower.includes("cordero") || lower.includes("chorizo") || lower.includes("salchichón") || lower.includes("morcilla") || lower.includes("alitas") || lower.includes("costillas") || lower.includes("fuet") || lower.includes("lacón") || lower.includes("bacon") || lower.includes("panceta") || lower.includes("chistorra") || lower.includes("salchicha") || lower.includes("cecina") || lower.includes("sobrasada") || lower.includes("butifarra") || lower.includes("chuleta") || lower.includes("entrecot") || lower.includes("pato")) {
    return "Carne";
  }
  
  // 5. Dairy (Lácteos)
  if (lower.includes("leche") || lower.includes("yogur") || lower.includes("queso") || lower.includes("cottage") || lower.includes("lácteo") || lower.includes("cuajada") || lower.includes("kéfir") || lower.includes("nata") || lower.includes("mozzarella") || lower.includes("mascarpone") || lower.includes("parmesano") || lower.includes("burgos") || lower.includes("manchego")) {
    return "Lácteos";
  }
  
  // 6. Fruits (Fruta)
  if (lower.includes("plátano") || lower.includes("manzana") || lower.includes("fresa") || lower.includes("fresas") || lower.includes("arándano") || lower.includes("arándanos") || lower.includes("fruta") || lower.includes("naranja") || lower.includes("limón") || lower.includes("pera") || lower.includes("kiwi") || lower.includes("melocotón") || lower.includes("piña") || lower.includes("uva") || lower.includes("uvas") || lower.includes("mango") || lower.includes("sandía") || lower.includes("melón") || lower.includes("frambuesa") || lower.includes("frambuesas") || lower.includes("mandarina") || lower.includes("lima") || lower.includes("nectarina") || lower.includes("albaricoque") || lower.includes("cereza") || lower.includes("cerezas") || lower.includes("ciruela") || lower.includes("ciruelas") || lower.includes("higo") || lower.includes("caqui") || lower.includes("níspero") || lower.includes("granada") || lower.includes("paraguayo") || lower.includes("chirimoya") || lower.includes("breva") || lower.includes("pomelo")) {
    return "Fruta";
  }
  
  // 7. Legumes (Legumbres)
  if (lower.includes("lenteja") || lower.includes("lentejas") || lower.includes("tofu") || lower.includes("legumbre") || lower.includes("garbanzo") || lower.includes("garbanzos") || lower.includes("judía") || lower.includes("alubia") || lower.includes("alubias") || lower.includes("soja") || lower.includes("habas") || lower.includes("guisantes") || lower.includes("guisante") || lower.includes("altramuces") || lower.includes("tempeh") || lower.includes("seitán") || lower.includes("bebida de soja")) {
    return "Legumbres";
  }
  
  // 8. Cereals & Carbs (Cereales/Carbohidratos)
  if (lower.includes("arroz") || lower.includes("avena") || lower.includes("pan ") || lower.includes("pan integral") || lower.includes("patata") || lower.includes("patatas") || lower.includes("pasta") || lower.includes("boniato") || lower.includes("quinoa") || lower.includes("cereal") || lower.includes("centeno") || lower.includes("espagueti") || lower.includes("macarrón") || lower.includes("harina") || lower.includes("tallarines") || lower.includes("macarrones") || lower.includes("espaguetis") || lower.includes("tortitas de arroz") || lower.includes("tortitas de maíz") || lower.includes("galletas") || lower.includes("galleta") || lower.includes("cuscús") || lower.includes("picos") || lower.includes("regañás") || lower.includes("gofio") || lower.includes("castaña") || lower.includes("castañas") || lower.includes("membrillo") || lower.includes("salmorejo") || lower.includes("bebida de avena")) {
    return "Cereales/Carbohidratos";
  }
  
  return "Otros";
}
