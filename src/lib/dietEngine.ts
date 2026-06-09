export interface DietFood {
  id: string;
  name: string;
  brand: string | null;
  calories: number; // per 100g
  protein: number;  // per 100g
  carbs: number;    // per 100g
  fat: number;      // per 100g
  group: "CARB" | "PROTEIN" | "FAT" | "DAIRY" | "FRUIT" | "VEG";
  isVegan: boolean;
  isVegetarian: boolean;
  isKeto: boolean;
  allergens: string[]; // GLUTEN, LACTOSE, NUTS, EGG, FISH
  styles: string[];    // CLASSIC, MEDITERRANEAN, QUICK
  portionSize: number; // typical portion in grams
  portionName: string; // e.g. "taza", "filete", "unidad"
  meals: ("BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")[];
}

// 1. Comprehensive Food Catalog
export const STANDARD_FOODS: DietFood[] = [
  {
    id: "std-oats",
    name: "Avena en copos",
    brand: "FitWe Natural",
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
    group: "CARB",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: ["GLUTEN"],
    styles: ["CLASSIC", "MEDITERRANEAN", "QUICK"],
    portionSize: 50,
    portionName: "taza de copos (50g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-chicken",
    name: "Pechuga de pollo",
    brand: null,
    calories: 165,
    protein: 31.0,
    carbs: 0.0,
    fat: 3.6,
    group: "PROTEIN",
    isVegan: false,
    isVegetarian: false,
    isKeto: true,
    allergens: [],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 150,
    portionName: "filete mediano (150g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-brown-rice",
    name: "Arroz integral cocido",
    brand: null,
    calories: 111,
    protein: 2.6,
    carbs: 23.0,
    fat: 0.9,
    group: "CARB",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: [],
    styles: ["CLASSIC", "MEDITERRANEAN"],
    portionSize: 150,
    portionName: "taza colmada (150g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-white-rice",
    name: "Arroz blanco cocido",
    brand: null,
    calories: 130,
    protein: 2.7,
    carbs: 28.0,
    fat: 0.3,
    group: "CARB",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: [],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 150,
    portionName: "taza (150g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-whole-egg",
    name: "Huevo entero",
    brand: null,
    calories: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    group: "PROTEIN",
    isVegan: false,
    isVegetarian: true,
    isKeto: true,
    allergens: ["EGG"],
    styles: ["CLASSIC", "MEDITERRANEAN", "QUICK"],
    portionSize: 60,
    portionName: "unidad grande (60g)",
    meals: ["BREAKFAST", "LUNCH", "DINNER"]
  },
  {
    id: "std-egg-white",
    name: "Clara de huevo",
    brand: null,
    calories: 52,
    protein: 11.0,
    carbs: 0.7,
    fat: 0.2,
    group: "PROTEIN",
    isVegan: false,
    isVegetarian: true,
    isKeto: true,
    allergens: ["EGG"],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 33,
    portionName: "unidad (33g)",
    meals: ["BREAKFAST", "LUNCH", "DINNER"]
  },
  {
    id: "std-salmon",
    name: "Filete de salmón fresco",
    brand: null,
    calories: 206,
    protein: 22.0,
    carbs: 0.0,
    fat: 13.0,
    group: "PROTEIN",
    isVegan: false,
    isVegetarian: false,
    isKeto: true,
    allergens: ["FISH"],
    styles: ["MEDITERRANEAN"],
    portionSize: 150,
    portionName: "filete mediano (150g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-tuna",
    name: "Atún al natural",
    brand: null,
    calories: 116,
    protein: 26.0,
    carbs: 0.0,
    fat: 1.0,
    group: "PROTEIN",
    isVegan: false,
    isVegetarian: false,
    isKeto: true,
    allergens: ["FISH"],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 80,
    portionName: "lata pequeña (80g)",
    meals: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]
  },
  {
    id: "std-tofu",
    name: "Tofu firme",
    brand: null,
    calories: 144,
    protein: 17.0,
    carbs: 2.8,
    fat: 8.0,
    group: "PROTEIN",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: [],
    styles: ["CLASSIC", "MEDITERRANEAN", "QUICK"],
    portionSize: 150,
    portionName: "media porción de bloque (150g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-whole-wheat-bread",
    name: "Pan integral de centeno",
    brand: null,
    calories: 247,
    protein: 13.0,
    carbs: 41.0,
    fat: 3.4,
    group: "CARB",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: ["GLUTEN"],
    styles: ["MEDITERRANEAN", "QUICK"],
    portionSize: 35,
    portionName: "rebanada mediana (35g)",
    meals: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]
  },
  {
    id: "std-potato",
    name: "Patata cocida",
    brand: null,
    calories: 87,
    protein: 1.9,
    carbs: 20.0,
    fat: 0.1,
    group: "CARB",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: [],
    styles: ["CLASSIC", "MEDITERRANEAN"],
    portionSize: 200,
    portionName: "patata mediana (200g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-avocado",
    name: "Aguacate fresco",
    brand: null,
    calories: 160,
    protein: 2.0,
    carbs: 9.0,
    fat: 15.0,
    group: "FAT",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: [],
    styles: ["MEDITERRANEAN", "QUICK"],
    portionSize: 100,
    portionName: "medio aguacate (100g)",
    meals: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]
  },
  {
    id: "std-olive-oil",
    name: "Aceite de oliva virgen extra",
    brand: null,
    calories: 884,
    protein: 0.0,
    carbs: 0.0,
    fat: 100.0,
    group: "FAT",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: [],
    styles: ["CLASSIC", "MEDITERRANEAN", "QUICK"],
    portionSize: 10,
    portionName: "cucharada sopera (10g)",
    meals: ["BREAKFAST", "LUNCH", "DINNER"]
  },
  {
    id: "std-walnuts",
    name: "Nueces peladas",
    brand: null,
    calories: 654,
    protein: 15.0,
    carbs: 14.0,
    fat: 65.0,
    group: "FAT",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: ["NUTS"],
    styles: ["MEDITERRANEAN"],
    portionSize: 20,
    portionName: "puñado pequeño / 7 nueces (20g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-peanut-butter",
    name: "Crema de cacahuete natural",
    brand: null,
    calories: 588,
    protein: 25.0,
    carbs: 20.0,
    fat: 50.0,
    group: "FAT",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: ["NUTS"],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 15,
    portionName: "cucharadita colmada (15g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-skim-milk",
    name: "Leche desnatada",
    brand: null,
    calories: 35,
    protein: 3.4,
    carbs: 4.8,
    fat: 0.1,
    group: "DAIRY",
    isVegan: false,
    isVegetarian: true,
    isKeto: false,
    allergens: ["LACTOSE"],
    styles: ["CLASSIC", "MEDITERRANEAN", "QUICK"],
    portionSize: 200,
    portionName: "vaso normal (200ml)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-greek-yogurt",
    name: "Yogur griego natural 0%",
    brand: null,
    calories: 57,
    protein: 10.0,
    carbs: 4.0,
    fat: 0.0,
    group: "DAIRY",
    isVegan: false,
    isVegetarian: true,
    isKeto: true,
    allergens: ["LACTOSE"],
    styles: ["MEDITERRANEAN"],
    portionSize: 125,
    portionName: "tarrina individual (125g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-whipped-cheese",
    name: "Queso fresco batido 0%",
    brand: null,
    calories: 47,
    protein: 8.0,
    carbs: 3.5,
    fat: 0.0,
    group: "DAIRY",
    isVegan: false,
    isVegetarian: true,
    isKeto: true,
    allergens: ["LACTOSE"],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 250,
    portionName: "tarrina mediana (250g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-banana",
    name: "Plátano maduro",
    brand: null,
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    group: "FRUIT",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: [],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 100,
    portionName: "plátano mediano (100g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-apple",
    name: "Manzana roja",
    brand: null,
    calories: 52,
    protein: 0.3,
    carbs: 14.0,
    fat: 0.2,
    group: "FRUIT",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: [],
    styles: ["MEDITERRANEAN", "QUICK"],
    portionSize: 150,
    portionName: "unidad mediana (150g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-broccoli",
    name: "Brócoli cocido",
    brand: null,
    calories: 34,
    protein: 2.8,
    carbs: 7.0,
    fat: 0.4,
    group: "VEG",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: [],
    styles: ["CLASSIC", "MEDITERRANEAN"],
    portionSize: 150,
    portionName: "taza de ramilletes (150g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-spinach",
    name: "Espinacas frescas",
    brand: null,
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    group: "VEG",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: [],
    styles: ["MEDITERRANEAN", "QUICK"],
    portionSize: 100,
    portionName: "2 tazas colmadas (100g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-whey-protein",
    name: "Proteína de suero (Whey)",
    brand: "FitWe Performance",
    calories: 360,
    protein: 80.0,
    carbs: 5.0,
    fat: 3.0,
    group: "PROTEIN",
    isVegan: false,
    isVegetarian: true,
    isKeto: true,
    allergens: ["LACTOSE"],
    styles: ["CLASSIC", "QUICK"],
    portionSize: 30,
    portionName: "cazo / scoop (30g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-vegan-protein",
    name: "Proteína vegana (Guisante/Arroz)",
    brand: "FitWe Organic",
    calories: 380,
    protein: 75.0,
    carbs: 6.0,
    fat: 4.0,
    group: "PROTEIN",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: [],
    styles: ["QUICK"],
    portionSize: 30,
    portionName: "cazo / scoop (30g)",
    meals: ["BREAKFAST", "SNACK"]
  },
  {
    id: "std-whole-pasta",
    name: "Pasta integral cocida",
    brand: null,
    calories: 124,
    protein: 5.3,
    carbs: 26.0,
    fat: 0.8,
    group: "CARB",
    isVegan: true,
    isVegetarian: true,
    isKeto: false,
    allergens: ["GLUTEN"],
    styles: ["MEDITERRANEAN"],
    portionSize: 150,
    portionName: "plato colmado (150g)",
    meals: ["LUNCH", "DINNER"]
  },
  {
    id: "std-almond-milk",
    name: "Leche de almendras sin azúcar",
    brand: null,
    calories: 13,
    protein: 0.4,
    carbs: 0.2,
    fat: 1.1,
    group: "DAIRY",
    isVegan: true,
    isVegetarian: true,
    isKeto: true,
    allergens: ["NUTS"],
    styles: ["QUICK"],
    portionSize: 200,
    portionName: "vaso grande (200ml)",
    meals: ["BREAKFAST", "SNACK"]
  }
];

// Helper to filter foods by user profiles (dietType and allergens)
export function filterFoodsForUser(
  foods: DietFood[],
  dietType: string,
  userAllergens: string[]
): DietFood[] {
  return foods.filter((food) => {
    // 1. Check Diet Type constraints
    if (dietType === "VEGAN" && !food.isVegan) return false;
    if (dietType === "VEGETARIAN" && !food.isVegetarian) return false;
    if (dietType === "KETO" && !food.isKeto && food.group === "CARB") {
      // In Keto, restrict heavy carb items (grains/pasta/potatoes)
      return false;
    }

    // 2. Check Allergen constraints
    const hasAllergenConflict = food.allergens.some((allg) =>
      userAllergens.includes(allg)
    );
    if (hasAllergenConflict) return false;

    return true;
  });
}

// 2. Linear Macro Solver
export interface SolvedItem {
  food: DietFood;
  quantityGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  equivalentText: string;
}

export function solveMealGrams(
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  foodsInMeal: {
    carb?: DietFood;
    protein?: DietFood;
    fat?: DietFood;
    veg?: DietFood;
    fruit?: DietFood;
  }
): SolvedItem[] {
  const result: SolvedItem[] = [];
  
  // Set fixed vegetables/fruits first (typically 100g portions for simplicity and satiety)
  let fixedCalories = 0;
  let fixedProtein = 0;
  let fixedCarbs = 0;
  let fixedFat = 0;

  const processFixedItem = (f: DietFood | undefined, qty: number) => {
    if (!f) return;
    const cal = Math.round((f.calories * qty) / 100);
    const pro = Math.round(((f.protein * qty) / 100) * 10) / 10;
    const carb = Math.round(((f.carbs * qty) / 100) * 10) / 10;
    const fat = Math.round(((f.fat * qty) / 100) * 10) / 10;
    
    fixedCalories += cal;
    fixedProtein += pro;
    fixedCarbs += carb;
    fixedFat += fat;

    result.push({
      food: f,
      quantityGrams: qty,
      calories: cal,
      protein: pro,
      carbs: carb,
      fat: fat,
      equivalentText: getPortionEquivalent(f, qty),
    });
  };

  processFixedItem(foodsInMeal.veg, 120);
  processFixedItem(foodsInMeal.fruit, 100);

  // Remaining targets for dynamic items (C, P, F)
  const remPro = Math.max(5, targetProtein - fixedProtein);
  const remCarb = Math.max(5, targetCarbs - fixedCarbs);
  const remFat = Math.max(2, targetFat - fixedFat);

  // Extract dynamic items
  const cFood = foodsInMeal.carb;
  const pFood = foodsInMeal.protein;
  const fFood = foodsInMeal.fat;

  // Initial weights in 100g units
  let wc = cFood ? remCarb / cFood.carbs : 0;
  let wp = pFood ? remPro / pFood.protein : 0;
  let wf = fFood ? remFat / fFood.fat : 0;

  // Run iterative relaxation to solve cross-macro dependencies (5 iterations converge perfectly)
  for (let i = 0; i < 5; i++) {
    if (cFood) {
      const pContrib = wp * (pFood?.protein || 0) + wf * (fFood?.protein || 0);
      const fContrib = wp * (pFood?.fat || 0) + wf * (fFood?.fat || 0);
      wc = Math.max(0.2, (remCarb - wp * (pFood?.carbs || 0) - wf * (fFood?.carbs || 0)) / cFood.carbs);
    }
    if (pFood) {
      const cContrib = wc * (cFood?.carbs || 0) + wf * (fFood?.carbs || 0);
      const fContrib = wc * (cFood?.fat || 0) + wf * (fFood?.fat || 0);
      wp = Math.max(0.3, (remPro - wc * (cFood?.protein || 0) - wf * (fFood?.protein || 0)) / pFood.protein);
    }
    if (fFood) {
      const cContrib = wc * (cFood?.carbs || 0) + wp * (pFood?.carbs || 0);
      const pContrib = wc * (cFood?.protein || 0) + wp * (pFood?.protein || 0);
      wf = Math.max(0.05, (remFat - wc * (cFood?.fat || 0) - wp * (pFood?.fat || 0)) / fFood.fat);
    }
  }

  const addDynamicItem = (f: DietFood | undefined, wUnits: number) => {
    if (!f) return;
    const qty = Math.round(wUnits * 100);
    const cal = Math.round((f.calories * qty) / 100);
    const pro = Math.round(((f.protein * qty) / 100) * 10) / 10;
    const carb = Math.round(((f.carbs * qty) / 100) * 10) / 10;
    const fat = Math.round(((f.fat * qty) / 100) * 10) / 10;

    result.push({
      food: f,
      quantityGrams: qty,
      calories: cal,
      protein: pro,
      carbs: carb,
      fat: fat,
      equivalentText: getPortionEquivalent(f, qty),
    });
  };

  addDynamicItem(cFood, wc);
  addDynamicItem(pFood, wp);
  addDynamicItem(fFood, wf);

  return result;
}

// 3. Culinary Portion Descriptors (Portion Equivalents)
export function getPortionEquivalent(food: DietFood, grams: number): string {
  if (grams <= 0) return "0g";

  switch (food.id) {
    case "std-oats":
      if (grams < 30) return "aprox. 3 cucharadas soperas";
      if (grams <= 60) return "aprox. 1 taza mediana";
      return `aprox. ${Math.round((grams / 50) * 10) / 10} tazas`;
    case "std-chicken":
      if (grams <= 100) return "aprox. 1 filete pequeño";
      if (grams <= 180) return "aprox. 1 pechuga mediana";
      return `aprox. ${Math.round((grams / 150) * 10) / 10} pechugas medianas`;
    case "std-brown-rice":
    case "std-white-rice":
      return `aprox. ${Math.round(grams / 150)} taza cocida (${grams}g)`;
    case "std-whole-egg":
      return `${Math.round(grams / 60)} huevo entero(s)`;
    case "std-egg-white":
      return `aprox. ${Math.round(grams / 33)} claras de huevo`;
    case "std-salmon":
      return `aprox. ${Math.round((grams / 150) * 10) / 10} filete de salmón`;
    case "std-tuna":
      return `aprox. ${Math.round((grams / 80) * 10) / 10} lata(s) de atún`;
    case "std-tofu":
      return `aprox. ${Math.round(grams)}g de tofu`;
    case "std-whole-wheat-bread":
      const slices = Math.round(grams / 35);
      return `${slices || 1} rebanada(s) de pan`;
    case "std-potato":
      return `aprox. ${Math.round((grams / 200) * 10) / 10} patata mediana`;
    case "std-avocado":
      return `aprox. ${Math.round((grams / 200) * 2)} mitad de aguacate`;
    case "std-olive-oil":
      if (grams < 8) return "1 cucharadita de café";
      if (grams <= 15) return "1 cucharada sopera";
      return `aprox. ${Math.round(grams / 10)} cucharadas soperas`;
    case "std-walnuts":
      return `aprox. ${Math.round(grams / 3)} nueces (${grams}g)`;
    case "std-peanut-butter":
      if (grams < 12) return "1 cucharadita pequeña";
      return `aprox. ${Math.round(grams / 15)} cucharada colmada`;
    case "std-skim-milk":
    case "std-almond-milk":
      return `aprox. ${Math.round(grams / 200)} vaso (${grams}ml)`;
    case "std-greek-yogurt":
      return `aprox. ${Math.round((grams / 125) * 10) / 10} vaso de yogur`;
    case "std-whipped-cheese":
      return `aprox. ${Math.round((grams / 250) * 10) / 10} tarrina mediana`;
    case "std-banana":
      return `aprox. ${Math.round((grams / 100) * 10) / 10} plátano(s)`;
    case "std-apple":
      return `aprox. ${Math.round((grams / 150) * 10) / 10} manzana(s)`;
    case "std-broccoli":
      return `aprox. ${Math.round(grams)}g de brócoli`;
    case "std-spinach":
      return `aprox. ${Math.round(grams / 50)} tazas de hojas de espinaca`;
    case "std-whey-protein":
    case "std-vegan-protein":
      return `${Math.round(grams / 30) || 1} cazo de proteína (scoop)`;
    case "std-whole-pasta":
      return `aprox. ${Math.round((grams / 150) * 10) / 10} plato hondo (cocido)`;
    default:
      return `${grams}g`;
  }
}

// 4. Culinary Styles Meals Templates
export function getMealTemplate(
  mealType: string,
  style: string,
  availableFoods: DietFood[],
  prioritizedFoodIds: string[] = []
): {
  carb?: DietFood;
  protein?: DietFood;
  fat?: DietFood;
  veg?: DietFood;
  fruit?: DietFood;
} {
  const getFood = (group: string, backupId: string) => {
    // Filter by group AND check if the food is suitable for this specific meal type
    let list = availableFoods.filter((f) => f.group === group && f.meals.includes(mealType as any));
    
    // Fallback if user exclusions or tags left this group empty for this meal
    if (list.length === 0) {
      list = availableFoods.filter((f) => f.group === group);
    }
    
    // 1. Prioritize foods liked by the user (if any are in this group)
    const preferredList = list.filter((f) => prioritizedFoodIds.includes(f.id));
    
    // 2. Otherwise prioritize style if possible
    const styleList = list.filter((f) => f.styles.includes(style));
    
    // Select from preferred, then style, then general list
    let finalSelection = list;
    if (preferredList.length > 0) {
      finalSelection = preferredList;
    } else if (styleList.length > 0) {
      finalSelection = styleList;
    }
    
    if (finalSelection.length === 0) {
      // Return absolute fallback from standard list if user constraints left group empty
      return STANDARD_FOODS.find((f) => f.id === backupId);
    }
    return finalSelection[Math.floor(Math.random() * finalSelection.length)];
  };

  switch (mealType) {
    case "BREAKFAST":
      // Breakfast: Carb (oats/bread) + Protein (eggs/whites/protein shake) + Fruit/Dairy (milk/banana)
      return {
        carb: getFood("CARB", "std-oats"),
        protein: getFood("PROTEIN", "std-egg-white"),
        fruit: getFood("FRUIT", "std-banana"),
        fat: getFood("FAT", "std-olive-oil"),
      };
    case "LUNCH":
      // Lunch: Carb (rice/pasta/potato) + Protein (chicken/turkey/beef/tofu) + Veg + Fat (avocado/oil)
      return {
        carb: getFood("CARB", "std-brown-rice"),
        protein: getFood("PROTEIN", "std-chicken"),
        veg: getFood("VEG", "std-broccoli"),
        fat: getFood("FAT", "std-olive-oil"),
      };
    case "DINNER":
      // Dinner: Protein (salmon/fish/eggs/tofu) + Veg + Fat (oil/avocado) + light Carb (potato)
      return {
        carb: getFood("CARB", "std-potato"),
        protein: getFood("PROTEIN", "std-salmon"),
        veg: getFood("VEG", "std-spinach"),
        fat: getFood("FAT", "std-olive-oil"),
      };
    case "SNACK":
      // Snack: Fruit + Fat (nuts/peanut butter) + Protein/Dairy (yogurt/cheese/shake)
      return {
        protein: getFood("PROTEIN", "std-whey-protein"),
        fat: getFood("FAT", "std-walnuts"),
        fruit: getFood("FRUIT", "std-apple"),
      };
    default:
      return {};
  }
}

// 5. Generate Full Diet Plan
export interface MealPlan {
  mealType: string;
  mealLabel: string;
  items: SolvedItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function generateDietPlan(
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  dietType: string,
  allergensList: string[],
  culinaryStyle: string,
  excludedFoodIds: string[] = [],
  prioritizedFoodIds: string[] = []
): MealPlan[] {
  // Pre-filter catalog
  let filteredFoods = filterFoodsForUser(STANDARD_FOODS, dietType, allergensList);

  // Apply custom food exclusions
  if (excludedFoodIds.length > 0) {
    filteredFoods = filteredFoods.filter((f) => !excludedFoodIds.includes(f.id));
  }

  const mealAllocations = [
    { type: "BREAKFAST", label: "Desayuno", pct: 0.25 },
    { type: "LUNCH", label: "Almuerzo", pct: 0.35 },
    { type: "DINNER", label: "Cena", pct: 0.25 },
    { type: "SNACK", label: "Snacks", pct: 0.15 },
  ];

  return mealAllocations.map((alloc) => {
    const mealCals = Math.round(targetCalories * alloc.pct);
    const mealPro = Math.round(targetProtein * alloc.pct);
    const mealCarbs = Math.round(targetCarbs * alloc.pct);
    const mealFat = Math.round(targetFat * alloc.pct);

    const template = getMealTemplate(alloc.type, culinaryStyle, filteredFoods, prioritizedFoodIds);
    const solvedItems = solveMealGrams(mealCals, mealPro, mealCarbs, mealFat, template);

    // Sum actual macros solved
    let actualCals = 0;
    let actualPro = 0;
    let actualCarbs = 0;
    let actualFat = 0;

    solvedItems.forEach((item) => {
      actualCals += item.calories;
      actualPro += item.protein;
      actualCarbs += item.carbs;
      actualFat += item.fat;
    });

    return {
      mealType: alloc.type,
      mealLabel: alloc.label,
      items: solvedItems,
      calories: Math.round(actualCals),
      protein: Math.round(actualPro * 10) / 10,
      carbs: Math.round(actualCarbs * 10) / 10,
      fat: Math.round(actualFat * 10) / 10,
    };
  });
}
