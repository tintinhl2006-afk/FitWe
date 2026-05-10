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
