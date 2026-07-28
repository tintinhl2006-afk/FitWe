export interface DietFood {
  id: string;
  name: string;
  brand: string | null;
  calories: number; // per 100g
  protein: number;  // per 100g
  carbs: number;    // per 100g
  fat: number;      // per 100g
  group: "CARB" | "PROTEIN" | "FAT" | "DAIRY" | "FRUIT" | "VEG" | "Otros";
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
    "id": "std-pechuga-pollo",
    "name": "Pechuga de pollo",
    "brand": null,
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fat": 3.6,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pechuga-pavo",
    "name": "Pechuga de pavo",
    "brand": null,
    "calories": 114,
    "protein": 24,
    "carbs": 0.1,
    "fat": 2,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-lomo-cerdo",
    "name": "Lomo de cerdo",
    "brand": null,
    "calories": 143,
    "protein": 22,
    "carbs": 0,
    "fat": 6,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-ternera",
    "name": "Ternera",
    "brand": null,
    "calories": 137,
    "protein": 21,
    "carbs": 0,
    "fat": 5.8,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-jamon-serrano",
    "name": "Jamón serrano",
    "brand": null,
    "calories": 220,
    "protein": 30,
    "carbs": 0,
    "fat": 11,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-jamon-cocido",
    "name": "Jamón cocido",
    "brand": null,
    "calories": 105,
    "protein": 18,
    "carbs": 1,
    "fat": 3,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 60,
    "portionName": "3 lonchas (60g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-carne-picada-ternera",
    "name": "Carne picada de ternera",
    "brand": null,
    "calories": 150,
    "protein": 20,
    "carbs": 0,
    "fat": 7.2,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-carne-picada-cerdo",
    "name": "Carne picada de cerdo",
    "brand": null,
    "calories": 263,
    "protein": 17,
    "carbs": 0,
    "fat": 21,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-carne-picada-pollo",
    "name": "Carne picada de pollo",
    "brand": null,
    "calories": 120,
    "protein": 20,
    "carbs": 0,
    "fat": 4.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-muslo-pollo",
    "name": "Muslo de pollo",
    "brand": null,
    "calories": 120,
    "protein": 20,
    "carbs": 0,
    "fat": 4.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-alitas-pollo",
    "name": "Alitas de pollo",
    "brand": null,
    "calories": 203,
    "protein": 18,
    "carbs": 0,
    "fat": 14,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-costillas-cerdo",
    "name": "Costillas de cerdo",
    "brand": null,
    "calories": 280,
    "protein": 16,
    "carbs": 0,
    "fat": 24,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 200,
    "portionName": "ración (200g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-hamburguesa-ternera",
    "name": "Hamburguesa de ternera",
    "brand": null,
    "calories": 200,
    "protein": 18,
    "carbs": 0,
    "fat": 14,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 120,
    "portionName": "unidad (120g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-hamburguesa-pollo",
    "name": "Hamburguesa de pollo",
    "brand": null,
    "calories": 150,
    "protein": 18,
    "carbs": 1,
    "fat": 8,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 120,
    "portionName": "unidad (120g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-chorizo",
    "name": "Chorizo",
    "brand": null,
    "calories": 350,
    "protein": 22,
    "carbs": 2,
    "fat": 28,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 40,
    "portionName": "ración (40g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-salchichon",
    "name": "Salchichón",
    "brand": null,
    "calories": 380,
    "protein": 26,
    "carbs": 1.5,
    "fat": 30,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 40,
    "portionName": "ración (40g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-lomo-embuchado",
    "name": "Lomo embuchado",
    "brand": null,
    "calories": 230,
    "protein": 36,
    "carbs": 1,
    "fat": 9,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-morcilla",
    "name": "Morcilla",
    "brand": null,
    "calories": 320,
    "protein": 11,
    "carbs": 14,
    "fat": 25,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 80,
    "portionName": "ración (80g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-conejo",
    "name": "Conejo",
    "brand": null,
    "calories": 135,
    "protein": 22,
    "carbs": 0,
    "fat": 5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-cordero",
    "name": "Cordero",
    "brand": null,
    "calories": 230,
    "protein": 18,
    "carbs": 0,
    "fat": 17,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-fuet",
    "name": "Fuet",
    "brand": null,
    "calories": 410,
    "protein": 28,
    "carbs": 2,
    "fat": 32,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "ración (30g)",
    "meals": [
      "LUNCH",
      "DINNER",
      "SNACK"
    ]
  },
  {
    "id": "std-lacon",
    "name": "Lacón",
    "brand": null,
    "calories": 170,
    "protein": 22,
    "carbs": 0.5,
    "fat": 9,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER",
      "SNACK"
    ]
  },
  {
    "id": "std-bacon",
    "name": "Bacon",
    "brand": null,
    "calories": 541,
    "protein": 37,
    "carbs": 1.4,
    "fat": 42,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 40,
    "portionName": "2 lonchas (40g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-chistorra",
    "name": "Chistorra",
    "brand": null,
    "calories": 490,
    "protein": 16,
    "carbs": 1,
    "fat": 48,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-salchicha-cerdo",
    "name": "Salchicha de cerdo",
    "brand": null,
    "calories": 290,
    "protein": 14,
    "carbs": 2,
    "fat": 25,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "2 unidades (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-salchicha-pavo",
    "name": "Salchicha de pavo",
    "brand": null,
    "calories": 150,
    "protein": 15,
    "carbs": 1.5,
    "fat": 9,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "2 unidades (100g)",
    "meals": [
      "LUNCH",
      "DINNER",
      "SNACK"
    ]
  },
  {
    "id": "std-cecina",
    "name": "Cecina",
    "brand": null,
    "calories": 250,
    "protein": 39,
    "carbs": 1,
    "fat": 9.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-sobrasada",
    "name": "Sobrasada",
    "brand": null,
    "calories": 590,
    "protein": 11,
    "carbs": 1.5,
    "fat": 60,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 30,
    "portionName": "ración (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "LUNCH"
    ]
  },
  {
    "id": "std-butifarra",
    "name": "Butifarra",
    "brand": null,
    "calories": 310,
    "protein": 17,
    "carbs": 1.2,
    "fat": 26,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 120,
    "portionName": "unidad (120g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-chuleta-cerdo",
    "name": "Chuleta de cerdo",
    "brand": null,
    "calories": 231,
    "protein": 20,
    "carbs": 0,
    "fat": 16,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "chuleta (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-entrecot-ternera",
    "name": "Entrecot de ternera",
    "brand": null,
    "calories": 190,
    "protein": 21,
    "carbs": 0,
    "fat": 11.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 200,
    "portionName": "entrecot (200g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-salchichon-pavo",
    "name": "Salchichón de pavo",
    "brand": null,
    "calories": 270,
    "protein": 20,
    "carbs": 2,
    "fat": 20,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 40,
    "portionName": "ración (40g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-pato",
    "name": "Pato",
    "brand": null,
    "calories": 220,
    "protein": 19,
    "carbs": 0,
    "fat": 16,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-merluza",
    "name": "Merluza",
    "brand": null,
    "calories": 89,
    "protein": 16,
    "carbs": 0,
    "fat": 2.7,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-bacalao",
    "name": "Bacalao",
    "brand": null,
    "calories": 82,
    "protein": 18,
    "carbs": 0,
    "fat": 0.7,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "lomo mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-salmon",
    "name": "Salmón",
    "brand": null,
    "calories": 208,
    "protein": 20,
    "carbs": 0,
    "fat": 13,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "rodaja (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-atun",
    "name": "Atún",
    "brand": null,
    "calories": 130,
    "protein": 29,
    "carbs": 0,
    "fat": 0.6,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "lata (100g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-sardinas",
    "name": "Sardinas",
    "brand": null,
    "calories": 208,
    "protein": 22,
    "carbs": 0,
    "fat": 13,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 120,
    "portionName": "ración (120g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-boquerones",
    "name": "Boquerones",
    "brand": null,
    "calories": 140,
    "protein": 18,
    "carbs": 0,
    "fat": 7,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-dorada",
    "name": "Dorada",
    "brand": null,
    "calories": 110,
    "protein": 19.5,
    "carbs": 0,
    "fat": 3.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-lubina",
    "name": "Lubina",
    "brand": null,
    "calories": 97,
    "protein": 18.4,
    "carbs": 0,
    "fat": 2.6,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-calamares",
    "name": "Calamares",
    "brand": null,
    "calories": 92,
    "protein": 15.6,
    "carbs": 3.1,
    "fat": 1.4,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-sepia",
    "name": "Sepia",
    "brand": null,
    "calories": 80,
    "protein": 16,
    "carbs": 0.7,
    "fat": 0.9,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pulpo",
    "name": "Pulpo",
    "brand": null,
    "calories": 86,
    "protein": 18,
    "carbs": 0,
    "fat": 1,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 120,
    "portionName": "pata (120g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-gambas",
    "name": "Gambas",
    "brand": null,
    "calories": 99,
    "protein": 24,
    "carbs": 0,
    "fat": 0.3,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-langostinos",
    "name": "Langostinos",
    "brand": null,
    "calories": 99,
    "protein": 24,
    "carbs": 0,
    "fat": 0.3,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-mejillones",
    "name": "Mejillones",
    "brand": null,
    "calories": 86,
    "protein": 11.9,
    "carbs": 3.7,
    "fat": 2.2,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "ración limpia (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-almejas",
    "name": "Almejas",
    "brand": null,
    "calories": 74,
    "protein": 12.8,
    "carbs": 2,
    "fat": 1.2,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-trucha",
    "name": "Trucha",
    "brand": null,
    "calories": 141,
    "protein": 20,
    "carbs": 0,
    "fat": 6.6,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-lenguado",
    "name": "Lenguado",
    "brand": null,
    "calories": 80,
    "protein": 16.5,
    "carbs": 0,
    "fat": 1.3,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-bonito",
    "name": "Bonito",
    "brand": null,
    "calories": 138,
    "protein": 23,
    "carbs": 0,
    "fat": 5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-caballa",
    "name": "Caballa",
    "brand": null,
    "calories": 205,
    "protein": 19,
    "carbs": 0,
    "fat": 14,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pez-espada",
    "name": "Pez espada",
    "brand": null,
    "calories": 144,
    "protein": 20,
    "carbs": 0,
    "fat": 7,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "filete mediano (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-berberechos",
    "name": "Berberechos",
    "brand": null,
    "calories": 79,
    "protein": 15,
    "carbs": 1.5,
    "fat": 1,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "lata (80g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-navajas",
    "name": "Navajas",
    "brand": null,
    "calories": 85,
    "protein": 16,
    "carbs": 1.5,
    "fat": 1.2,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-gulas",
    "name": "Gulas",
    "brand": null,
    "calories": 165,
    "protein": 10,
    "carbs": 8,
    "fat": 10.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": false,
    "allergens": [
      "FISH",
      "GLUTEN"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-mejillones-escabeche",
    "name": "Mejillones en escabeche",
    "brand": null,
    "calories": 170,
    "protein": 14,
    "carbs": 3,
    "fat": 11,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "lata (80g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-boquerones-vinagre",
    "name": "Boquerones en vinagre",
    "brand": null,
    "calories": 150,
    "protein": 17,
    "carbs": 1,
    "fat": 8.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "ración (80g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-cigalas",
    "name": "Cigalas",
    "brand": null,
    "calories": 85,
    "protein": 17.5,
    "carbs": 0.5,
    "fat": 1,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-chipirones",
    "name": "Chipirones",
    "brand": null,
    "calories": 82,
    "protein": 16,
    "carbs": 1.2,
    "fat": 1.4,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": false,
    "isKeto": true,
    "allergens": [
      "FISH"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-tomate",
    "name": "Tomate",
    "brand": null,
    "calories": 18,
    "protein": 0.9,
    "carbs": 3.9,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad grande (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-lechuga",
    "name": "Lechuga",
    "brand": null,
    "calories": 15,
    "protein": 1.2,
    "carbs": 2.9,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-cebolla",
    "name": "Cebolla",
    "brand": null,
    "calories": 40,
    "protein": 1.1,
    "carbs": 9.3,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 50,
    "portionName": "media unidad (50g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-zanahoria",
    "name": "Zanahoria",
    "brand": null,
    "calories": 41,
    "protein": 0.9,
    "carbs": 9.6,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "unidad mediana (100g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-pepino",
    "name": "Pepino",
    "brand": null,
    "calories": 15,
    "protein": 0.7,
    "carbs": 3.6,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "medio pepino (100g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-calabacin",
    "name": "Calabacín",
    "brand": null,
    "calories": 17,
    "protein": 1.2,
    "carbs": 3.1,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-berenjena",
    "name": "Berenjena",
    "brand": null,
    "calories": 25,
    "protein": 1,
    "carbs": 6,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pimiento-rojo",
    "name": "Pimiento rojo",
    "brand": null,
    "calories": 31,
    "protein": 1,
    "carbs": 6,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "medio pimiento (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pimiento-verde",
    "name": "Pimiento verde",
    "brand": null,
    "calories": 20,
    "protein": 0.9,
    "carbs": 4.6,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "medio pimiento (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pimiento-amarillo",
    "name": "Pimiento amarillo",
    "brand": null,
    "calories": 27,
    "protein": 1,
    "carbs": 6.3,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "medio pimiento (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-brocoli",
    "name": "Brócoli",
    "brand": null,
    "calories": 34,
    "protein": 2.8,
    "carbs": 7,
    "fat": 0.4,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "taza de ramilletes (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-coliflor",
    "name": "Coliflor",
    "brand": null,
    "calories": 25,
    "protein": 1.9,
    "carbs": 5,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-espinacas",
    "name": "Espinacas",
    "brand": null,
    "calories": 23,
    "protein": 2.9,
    "carbs": 3.6,
    "fat": 0.4,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "tazón (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-acelgas",
    "name": "Acelgas",
    "brand": null,
    "calories": 19,
    "protein": 1.8,
    "carbs": 3.7,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-repollo",
    "name": "Repollo",
    "brand": null,
    "calories": 23,
    "protein": 1.3,
    "carbs": 5.5,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-judias-verdes",
    "name": "Judías verdes",
    "brand": null,
    "calories": 31,
    "protein": 1.8,
    "carbs": 7,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-alcachofas",
    "name": "Alcachofas",
    "brand": null,
    "calories": 47,
    "protein": 3.3,
    "carbs": 10.5,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 120,
    "portionName": "ración (120g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-esparragos",
    "name": "Espárragos",
    "brand": null,
    "calories": 20,
    "protein": 2.2,
    "carbs": 3.9,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "manojo pequeño (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-champinones",
    "name": "Champiñones",
    "brand": null,
    "calories": 22,
    "protein": 3.1,
    "carbs": 3.3,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "taza (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-setas",
    "name": "Setas",
    "brand": null,
    "calories": 31,
    "protein": 2.5,
    "carbs": 5.3,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-ajo",
    "name": "Ajo",
    "brand": null,
    "calories": 149,
    "protein": 6.4,
    "carbs": 33,
    "fat": 0.5,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 5,
    "portionName": "diente (5g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-puerro",
    "name": "Puerro",
    "brand": null,
    "calories": 61,
    "protein": 1.5,
    "carbs": 14,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "unidad (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-calabaza",
    "name": "Calabaza",
    "brand": null,
    "calories": 26,
    "protein": 1,
    "carbs": 6.5,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-apio",
    "name": "Apio",
    "brand": null,
    "calories": 16,
    "protein": 0.7,
    "carbs": 3,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "tallo (50g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-rabano",
    "name": "Rábano",
    "brand": null,
    "calories": 16,
    "protein": 0.7,
    "carbs": 3.4,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "3 unidades (50g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-canonigos",
    "name": "Canónigos",
    "brand": null,
    "calories": 14,
    "protein": 1.8,
    "carbs": 1.5,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "tazón (50g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-rucula",
    "name": "Rúcula",
    "brand": null,
    "calories": 25,
    "protein": 2.6,
    "carbs": 2.1,
    "fat": 0.7,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "tazón (50g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pimientos-padron",
    "name": "Pimientos de Padrón",
    "brand": null,
    "calories": 20,
    "protein": 0.9,
    "carbs": 3.5,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pimientos-piquillo",
    "name": "Pimientos del piquillo",
    "brand": null,
    "calories": 45,
    "protein": 1.2,
    "carbs": 8.5,
    "fat": 0.5,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-coles-bruselas",
    "name": "Coles de Bruselas",
    "brand": null,
    "calories": 43,
    "protein": 3.4,
    "carbs": 9,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-lombarda",
    "name": "Lombarda",
    "brand": null,
    "calories": 31,
    "protein": 1.5,
    "carbs": 7,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-remolacha",
    "name": "Remolacha",
    "brand": null,
    "calories": 43,
    "protein": 1.6,
    "carbs": 9.6,
    "fat": 0.2,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-esparrago-blanco",
    "name": "Espárrago blanco",
    "brand": null,
    "calories": 18,
    "protein": 1.2,
    "carbs": 3,
    "fat": 0.1,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER",
      "SNACK"
    ]
  },
  {
    "id": "std-bimi",
    "name": "Bimi",
    "brand": null,
    "calories": 35,
    "protein": 3,
    "carbs": 4,
    "fat": 0.5,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-grelos",
    "name": "Grelos",
    "brand": null,
    "calories": 22,
    "protein": 2.5,
    "carbs": 3,
    "fat": 0.3,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-platano",
    "name": "Plátano",
    "brand": null,
    "calories": 89,
    "protein": 1.1,
    "carbs": 22.8,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 120,
    "portionName": "unidad mediana (120g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-manzana",
    "name": "Manzana",
    "brand": null,
    "calories": 52,
    "protein": 0.3,
    "carbs": 14,
    "fat": 0.2,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad mediana (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-pera",
    "name": "Pera",
    "brand": null,
    "calories": 57,
    "protein": 0.4,
    "carbs": 15,
    "fat": 0.1,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad mediana (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-naranja",
    "name": "Naranja",
    "brand": null,
    "calories": 47,
    "protein": 0.9,
    "carbs": 11.8,
    "fat": 0.1,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad mediana (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-mandarina",
    "name": "Mandarina",
    "brand": null,
    "calories": 53,
    "protein": 0.8,
    "carbs": 13.3,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "unidad (80g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-fresa",
    "name": "Fresa",
    "brand": null,
    "calories": 32,
    "protein": 0.7,
    "carbs": 7.7,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "taza (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-arandanos",
    "name": "Arándanos",
    "brand": null,
    "calories": 57,
    "protein": 0.7,
    "carbs": 14,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "taza (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-frambuesas",
    "name": "Frambuesas",
    "brand": null,
    "calories": 52,
    "protein": 1.2,
    "carbs": 12,
    "fat": 0.7,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "taza (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-pina",
    "name": "Piña",
    "brand": null,
    "calories": 50,
    "protein": 0.5,
    "carbs": 13,
    "fat": 0.1,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 120,
    "portionName": "rodaja (120g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-sandia",
    "name": "Sandía",
    "brand": null,
    "calories": 30,
    "protein": 0.6,
    "carbs": 7.6,
    "fat": 0.2,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "tajada (200g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-melon",
    "name": "Melón",
    "brand": null,
    "calories": 34,
    "protein": 0.8,
    "carbs": 8.2,
    "fat": 0.2,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "tajada (200g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-melocototon",
    "name": "Melocotón",
    "brand": null,
    "calories": 39,
    "protein": 0.9,
    "carbs": 9.5,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-nectarina",
    "name": "Nectarina",
    "brand": null,
    "calories": 44,
    "protein": 1.1,
    "carbs": 10.6,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-albaricoque",
    "name": "Albaricoque",
    "brand": null,
    "calories": 48,
    "protein": 1.4,
    "carbs": 11,
    "fat": 0.4,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "2 unidades (80g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-cerezas",
    "name": "Cerezas",
    "brand": null,
    "calories": 50,
    "protein": 1,
    "carbs": 12,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-ciruela",
    "name": "Ciruela",
    "brand": null,
    "calories": 46,
    "protein": 0.7,
    "carbs": 11.4,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "2 unidades (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-uva",
    "name": "Uva",
    "brand": null,
    "calories": 67,
    "protein": 0.6,
    "carbs": 18,
    "fat": 0.4,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "racimo pequeño (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-mango",
    "name": "Mango",
    "brand": null,
    "calories": 60,
    "protein": 0.8,
    "carbs": 15,
    "fat": 0.4,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "media unidad (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-higo",
    "name": "Higo",
    "brand": null,
    "calories": 74,
    "protein": 0.8,
    "carbs": 19,
    "fat": 0.3,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 80,
    "portionName": "2 unidades (80g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-caqui",
    "name": "Caqui",
    "brand": null,
    "calories": 70,
    "protein": 0.6,
    "carbs": 18.6,
    "fat": 0.2,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-nispero",
    "name": "Níspero",
    "brand": null,
    "calories": 47,
    "protein": 0.4,
    "carbs": 12,
    "fat": 0.2,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "3 unidades (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-granada",
    "name": "Granada",
    "brand": null,
    "calories": 83,
    "protein": 1.7,
    "carbs": 19,
    "fat": 1.2,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "media unidad (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-paraguayo",
    "name": "Paraguayo",
    "brand": null,
    "calories": 44,
    "protein": 0.9,
    "carbs": 10.5,
    "fat": 0.1,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 130,
    "portionName": "unidad (130g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-chirimoya",
    "name": "Chirimoya",
    "brand": null,
    "calories": 75,
    "protein": 1.6,
    "carbs": 17.7,
    "fat": 0.7,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-kiwi",
    "name": "Kiwi",
    "brand": null,
    "calories": 61,
    "protein": 1.1,
    "carbs": 15,
    "fat": 0.5,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "unidad (80g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-pomelo",
    "name": "Pomelo",
    "brand": null,
    "calories": 42,
    "protein": 0.8,
    "carbs": 10.7,
    "fat": 0.1,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-higos-secos",
    "name": "Higos secos",
    "brand": null,
    "calories": 249,
    "protein": 3.3,
    "carbs": 54,
    "fat": 0.9,
    "group": "FRUIT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "ración (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-leche-entera",
    "name": "Leche entera",
    "brand": null,
    "calories": 61,
    "protein": 3.3,
    "carbs": 4.7,
    "fat": 3.3,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-leche-semidesnatada",
    "name": "Leche semidesnatada",
    "brand": null,
    "calories": 46,
    "protein": 3.4,
    "carbs": 4.8,
    "fat": 1.6,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-leche-desnatada",
    "name": "Leche desnatada",
    "brand": null,
    "calories": 34,
    "protein": 3.4,
    "carbs": 4.9,
    "fat": 0.1,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-yogur-natural",
    "name": "Yogur natural",
    "brand": null,
    "calories": 57,
    "protein": 3.5,
    "carbs": 4.7,
    "fat": 3.3,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 125,
    "portionName": "unidad (125g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-yogur-griego",
    "name": "Yogur griego",
    "brand": null,
    "calories": 120,
    "protein": 4,
    "carbs": 3.5,
    "fat": 10,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 125,
    "portionName": "unidad (125g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-queso-fresco",
    "name": "Queso fresco",
    "brand": null,
    "calories": 100,
    "protein": 12,
    "carbs": 3,
    "fat": 4,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "tarrina pequeña (80g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-curado",
    "name": "Queso curado",
    "brand": null,
    "calories": 380,
    "protein": 25,
    "carbs": 1,
    "fat": 30,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "cuña (30g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-semicurado",
    "name": "Queso semicurado",
    "brand": null,
    "calories": 350,
    "protein": 24,
    "carbs": 1,
    "fat": 28,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "cuña (30g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-tierno",
    "name": "Queso tierno",
    "brand": null,
    "calories": 310,
    "protein": 20,
    "carbs": 1,
    "fat": 25,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "cuña (30g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-cottage",
    "name": "Queso cottage",
    "brand": null,
    "calories": 98,
    "protein": 11,
    "carbs": 3.4,
    "fat": 4.3,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-mozzarella",
    "name": "Queso mozzarella",
    "brand": null,
    "calories": 280,
    "protein": 28,
    "carbs": 3.1,
    "fat": 17,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "bola (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-cabra",
    "name": "Queso de cabra",
    "brand": null,
    "calories": 364,
    "protein": 22,
    "carbs": 0.1,
    "fat": 30,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 30,
    "portionName": "rodaja (30g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-azul",
    "name": "Queso azul",
    "brand": null,
    "calories": 353,
    "protein": 21,
    "carbs": 2.3,
    "fat": 29,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 30,
    "portionName": "ración (30g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-mascarpone",
    "name": "Queso mascarpone",
    "brand": null,
    "calories": 429,
    "protein": 5.8,
    "carbs": 4.6,
    "fat": 44,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-queso-parmesano",
    "name": "Queso parmesano",
    "brand": null,
    "calories": 431,
    "protein": 38,
    "carbs": 4.1,
    "fat": 29,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 15,
    "portionName": "cucharada (15g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-kefir",
    "name": "Kéfir",
    "brand": null,
    "calories": 60,
    "protein": 3.5,
    "carbs": 4.8,
    "fat": 3,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-nata",
    "name": "Nata",
    "brand": null,
    "calories": 340,
    "protein": 2,
    "carbs": 3,
    "fat": 35,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-mantequilla",
    "name": "Mantequilla",
    "brand": null,
    "calories": 717,
    "protein": 0.9,
    "carbs": 0.1,
    "fat": 81,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 15,
    "portionName": "cucharada (15g)",
    "meals": [
      "BREAKFAST"
    ]
  },
  {
    "id": "std-queso-burgos",
    "name": "Queso de Burgos",
    "brand": null,
    "calories": 180,
    "protein": 11.5,
    "carbs": 3.5,
    "fat": 13.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 80,
    "portionName": "tarrina (80g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-oveja",
    "name": "Queso de oveja",
    "brand": null,
    "calories": 420,
    "protein": 26,
    "carbs": 1,
    "fat": 35,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "cuña (30g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-manchego",
    "name": "Queso Manchego",
    "brand": null,
    "calories": 460,
    "protein": 26,
    "carbs": 0.5,
    "fat": 40,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 30,
    "portionName": "cuña (30g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-queso-untar",
    "name": "Queso de untar",
    "brand": null,
    "calories": 240,
    "protein": 6,
    "carbs": 4,
    "fat": 22,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "ración (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-queso-batido",
    "name": "Queso batido",
    "brand": null,
    "calories": 46,
    "protein": 8,
    "carbs": 3.5,
    "fat": 0.1,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-cuajada",
    "name": "Cuajada",
    "brand": null,
    "calories": 92,
    "protein": 5.5,
    "carbs": 4.8,
    "fat": 5.6,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 130,
    "portionName": "tarrina (130g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-leche-cabra",
    "name": "Leche de cabra",
    "brand": null,
    "calories": 68,
    "protein": 3.6,
    "carbs": 4.5,
    "fat": 4.1,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-lentejas",
    "name": "Lentejas",
    "brand": null,
    "calories": 116,
    "protein": 9,
    "carbs": 20,
    "fat": 0.4,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "plato cocido (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-garbanzos",
    "name": "Garbanzos",
    "brand": null,
    "calories": 139,
    "protein": 7,
    "carbs": 19,
    "fat": 2.1,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "plato cocido (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-alubias-blancas",
    "name": "Alubias blancas",
    "brand": null,
    "calories": 105,
    "protein": 7.5,
    "carbs": 17,
    "fat": 0.5,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "plato cocido (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-alubias-pintas",
    "name": "Alubias pintas",
    "brand": null,
    "calories": 110,
    "protein": 8,
    "carbs": 18,
    "fat": 0.6,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "plato cocido (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-alubias-negras",
    "name": "Alubias negras",
    "brand": null,
    "calories": 114,
    "protein": 8,
    "carbs": 20,
    "fat": 0.5,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "plato cocido (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-guisantes",
    "name": "Guisantes",
    "brand": null,
    "calories": 81,
    "protein": 5.4,
    "carbs": 14,
    "fat": 0.4,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-habas",
    "name": "Habas",
    "brand": null,
    "calories": 88,
    "protein": 8,
    "carbs": 12,
    "fat": 0.7,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-soja",
    "name": "Soja",
    "brand": null,
    "calories": 147,
    "protein": 13,
    "carbs": 11,
    "fat": 6.8,
    "group": "PROTEIN",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-altramuces",
    "name": "Altramuces",
    "brand": null,
    "calories": 120,
    "protein": 15.6,
    "carbs": 10,
    "fat": 3,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "SNACK"
    ]
  },
  {
    "id": "std-lenteja-roja",
    "name": "Lenteja roja",
    "brand": null,
    "calories": 330,
    "protein": 24,
    "carbs": 50,
    "fat": 1.5,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 70,
    "portionName": "ración en seco (70g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-tofu",
    "name": "Tofu",
    "brand": null,
    "calories": 76,
    "protein": 8,
    "carbs": 1.9,
    "fat": 4.8,
    "group": "PROTEIN",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 125,
    "portionName": "bloque ración (125g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-seitan",
    "name": "Seitán",
    "brand": null,
    "calories": 120,
    "protein": 24,
    "carbs": 2.5,
    "fat": 1.2,
    "group": "PROTEIN",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 120,
    "portionName": "ración (120g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-avena",
    "name": "Avena",
    "brand": null,
    "calories": 389,
    "protein": 16.9,
    "carbs": 66.3,
    "fat": 6.9,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "taza de copos (50g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-arroz-blanco",
    "name": "Arroz blanco",
    "brand": null,
    "calories": 130,
    "protein": 2.7,
    "carbs": 28,
    "fat": 0.3,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "plato (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-arroz-integral",
    "name": "Arroz integral",
    "brand": null,
    "calories": 111,
    "protein": 2.6,
    "carbs": 23,
    "fat": 0.9,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "plato (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pasta",
    "name": "Pasta",
    "brand": null,
    "calories": 131,
    "protein": 5,
    "carbs": 25,
    "fat": 0.6,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "plato (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pan-integral",
    "name": "Pan integral",
    "brand": null,
    "calories": 250,
    "protein": 9,
    "carbs": 46,
    "fat": 2,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "2 rebanadas (50g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK"
    ]
  },
  {
    "id": "std-pan-blanco",
    "name": "Pan blanco",
    "brand": null,
    "calories": 265,
    "protein": 9,
    "carbs": 49,
    "fat": 3.2,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "rebanada (50g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK"
    ]
  },
  {
    "id": "std-pan-molde",
    "name": "Pan de molde",
    "brand": null,
    "calories": 260,
    "protein": 8.5,
    "carbs": 47,
    "fat": 3,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "2 rebanadas (50g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-patata",
    "name": "Patata",
    "brand": null,
    "calories": 77,
    "protein": 2,
    "carbs": 17,
    "fat": 0.1,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-boniato",
    "name": "Boniato",
    "brand": null,
    "calories": 86,
    "protein": 1.6,
    "carbs": 20,
    "fat": 0.1,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 150,
    "portionName": "unidad (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-quinoa",
    "name": "Quinoa",
    "brand": null,
    "calories": 120,
    "protein": 4.4,
    "carbs": 21.3,
    "fat": 1.9,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "ración (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-tortitas-arroz",
    "name": "Tortitas de arroz",
    "brand": null,
    "calories": 387,
    "protein": 8.2,
    "carbs": 81,
    "fat": 2.8,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "3 unidades (30g)",
    "meals": [
      "SNACK"
    ]
  },
  {
    "id": "std-tortitas-maiz",
    "name": "Tortitas de maíz",
    "brand": null,
    "calories": 380,
    "protein": 7,
    "carbs": 80,
    "fat": 3,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "3 unidades (30g)",
    "meals": [
      "SNACK"
    ]
  },
  {
    "id": "std-cereales-maiz",
    "name": "Cereales de maíz",
    "brand": null,
    "calories": 357,
    "protein": 8,
    "carbs": 84,
    "fat": 0.4,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 40,
    "portionName": "taza (40g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-galletas-maria",
    "name": "Galletas maría",
    "brand": null,
    "calories": 440,
    "protein": 7,
    "carbs": 75,
    "fat": 12,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "5 unidades (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-cuscus",
    "name": "Cuscús",
    "brand": null,
    "calories": 112,
    "protein": 3.8,
    "carbs": 23,
    "fat": 0.2,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "ración cocida (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-pan-centeno",
    "name": "Pan de centeno",
    "brand": null,
    "calories": 260,
    "protein": 8.5,
    "carbs": 48,
    "fat": 1.8,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "2 rebanadas (50g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK"
    ]
  },
  {
    "id": "std-pan-espelta",
    "name": "Pan de espelta",
    "brand": null,
    "calories": 262,
    "protein": 9.8,
    "carbs": 49,
    "fat": 2.2,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "2 rebanadas (50g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK"
    ]
  },
  {
    "id": "std-picos",
    "name": "Picos",
    "brand": null,
    "calories": 410,
    "protein": 10,
    "carbs": 76,
    "fat": 6.5,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 20,
    "portionName": "puñado (20g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-reganas",
    "name": "Regañás",
    "brand": null,
    "calories": 415,
    "protein": 9.5,
    "carbs": 78,
    "fat": 5.8,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 20,
    "portionName": "puñado (20g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-gofio",
    "name": "Gofio",
    "brand": null,
    "calories": 365,
    "protein": 11,
    "carbs": 71,
    "fat": 2.5,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 30,
    "portionName": "ración (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-arroz-basmati",
    "name": "Arroz basmati",
    "brand": null,
    "calories": 130,
    "protein": 2.7,
    "carbs": 28,
    "fat": 0.3,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 150,
    "portionName": "plato cocido (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-arroz-bomba",
    "name": "Arroz bomba",
    "brand": null,
    "calories": 130,
    "protein": 2.5,
    "carbs": 28.5,
    "fat": 0.2,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN"
    ],
    "portionSize": 150,
    "portionName": "plato cocido (150g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-castanas",
    "name": "Castañas",
    "brand": null,
    "calories": 196,
    "protein": 2,
    "carbs": 40,
    "fat": 2.2,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 50,
    "portionName": "5 unidades (50g)",
    "meals": [
      "SNACK"
    ]
  },
  {
    "id": "std-aceite-oliva",
    "name": "Aceite de oliva",
    "brand": null,
    "calories": 884,
    "protein": 0,
    "carbs": 0,
    "fat": 100,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 10,
    "portionName": "cucharada (10ml)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-aceite-girasol",
    "name": "Aceite de girasol",
    "brand": null,
    "calories": 884,
    "protein": 0,
    "carbs": 0,
    "fat": 100,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "CLASSIC"
    ],
    "portionSize": 10,
    "portionName": "cucharada (10ml)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-aguacate",
    "name": "Aguacate",
    "brand": null,
    "calories": 160,
    "protein": 2,
    "carbs": 9,
    "fat": 15,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 75,
    "portionName": "media unidad (75g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-nueces",
    "name": "Nueces",
    "brand": null,
    "calories": 654,
    "protein": 15,
    "carbs": 14,
    "fat": 65,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-almendras",
    "name": "Almendras",
    "brand": null,
    "calories": 579,
    "protein": 21,
    "carbs": 22,
    "fat": 49,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-avellanas",
    "name": "Avellanas",
    "brand": null,
    "calories": 628,
    "protein": 15,
    "carbs": 17,
    "fat": 61,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-pistachos",
    "name": "Pistachos",
    "brand": null,
    "calories": 562,
    "protein": 20,
    "carbs": 27,
    "fat": 45,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-cacahuetes",
    "name": "Cacahuetes",
    "brand": null,
    "calories": 567,
    "protein": 25.8,
    "carbs": 16.1,
    "fat": 49.2,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-anacardos",
    "name": "Anacardos",
    "brand": null,
    "calories": 553,
    "protein": 18,
    "carbs": 30,
    "fat": 44,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-pinones",
    "name": "Piñones",
    "brand": null,
    "calories": 673,
    "protein": 13.7,
    "carbs": 13,
    "fat": 68,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "MEDITERRANEAN"
    ],
    "portionSize": 20,
    "portionName": "cucharada (20g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-pipas-girasol",
    "name": "Pipas de girasol",
    "brand": null,
    "calories": 584,
    "protein": 20,
    "carbs": 20,
    "fat": 51,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "SNACK"
    ]
  },
  {
    "id": "std-pipas-calabaza",
    "name": "Pipas de calabaza",
    "brand": null,
    "calories": 559,
    "protein": 30,
    "carbs": 10,
    "fat": 49,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "puñado (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-aceitunas-verdes",
    "name": "Aceitunas verdes",
    "brand": null,
    "calories": 145,
    "protein": 1,
    "carbs": 4,
    "fat": 15,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-aceitunas-negras",
    "name": "Aceitunas negras",
    "brand": null,
    "calories": 115,
    "protein": 0.8,
    "carbs": 6,
    "fat": 10.7,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-margarina",
    "name": "Margarina",
    "brand": null,
    "calories": 717,
    "protein": 0.1,
    "carbs": 0.5,
    "fat": 81,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 10,
    "portionName": "cucharadita (10g)",
    "meals": [
      "BREAKFAST"
    ]
  },
  {
    "id": "std-crema-cacahuete",
    "name": "Crema de cacahuete",
    "brand": null,
    "calories": 590,
    "protein": 25,
    "carbs": 20,
    "fat": 50,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 20,
    "portionName": "cucharada (20g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-huevo-entero",
    "name": "Huevo entero",
    "brand": null,
    "calories": 143,
    "protein": 12.6,
    "carbs": 0.7,
    "fat": 9.5,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "EGG"
    ],
    "styles": [
      "CLASSIC",
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 60,
    "portionName": "unidad (60g)",
    "meals": [
      "BREAKFAST",
      "LUNCH",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-clara-huevo",
    "name": "Clara de huevo",
    "brand": null,
    "calories": 52,
    "protein": 11,
    "carbs": 0.7,
    "fat": 0.2,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "EGG"
    ],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 100,
    "portionName": "ración (100g)",
    "meals": [
      "BREAKFAST",
      "SNACK",
      "DINNER"
    ]
  },
  {
    "id": "std-proteina-suero",
    "name": "Proteína de suero",
    "brand": null,
    "calories": 380,
    "protein": 80,
    "carbs": 5,
    "fat": 3,
    "group": "PROTEIN",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "LACTOSE"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "cacito (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-proteina-vegana",
    "name": "Proteína vegana",
    "brand": null,
    "calories": 380,
    "protein": 78,
    "carbs": 6,
    "fat": 4,
    "group": "PROTEIN",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 30,
    "portionName": "cacito (30g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-gazpacho",
    "name": "Gazpacho",
    "brand": null,
    "calories": 45,
    "protein": 0.8,
    "carbs": 4.2,
    "fat": 2.5,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 250,
    "portionName": "vaso (250ml)",
    "meals": [
      "LUNCH",
      "DINNER",
      "SNACK"
    ]
  },
  {
    "id": "std-salmorejo",
    "name": "Salmorejo",
    "brand": null,
    "calories": 85,
    "protein": 1.2,
    "carbs": 8.5,
    "fat": 5,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "cuenco (200ml)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-tomate-frito",
    "name": "Tomate frito",
    "brand": null,
    "calories": 80,
    "protein": 1.5,
    "carbs": 7.5,
    "fat": 4.5,
    "group": "VEG",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "CLASSIC",
      "QUICK"
    ],
    "portionSize": 50,
    "portionName": "ración (50g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-bebida-avena",
    "name": "Bebida de avena",
    "brand": null,
    "calories": 45,
    "protein": 1,
    "carbs": 7.5,
    "fat": 1,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [
      "GLUTEN"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-bebida-soja",
    "name": "Bebida de soja",
    "brand": null,
    "calories": 40,
    "protein": 3,
    "carbs": 2.5,
    "fat": 1.8,
    "group": "PROTEIN",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-bebida-almendra",
    "name": "Bebida de almendra",
    "brand": null,
    "calories": 25,
    "protein": 0.5,
    "carbs": 2,
    "fat": 1.5,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "NUTS"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 200,
    "portionName": "vaso (200ml)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-mayonesa",
    "name": "Mayonesa",
    "brand": null,
    "calories": 680,
    "protein": 1,
    "carbs": 1.5,
    "fat": 75,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "EGG"
    ],
    "styles": [
      "QUICK"
    ],
    "portionSize": 15,
    "portionName": "cucharada (15g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-allioli",
    "name": "Allioli",
    "brand": null,
    "calories": 700,
    "protein": 1.2,
    "carbs": 2,
    "fat": 77,
    "group": "FAT",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [
      "EGG"
    ],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 15,
    "portionName": "cucharada (15g)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-chocolate-negro-85",
    "name": "Chocolate negro 85%",
    "brand": null,
    "calories": 580,
    "protein": 9,
    "carbs": 20,
    "fat": 46,
    "group": "FAT",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 20,
    "portionName": "onza (20g)",
    "meals": [
      "SNACK"
    ]
  },
  {
    "id": "std-miel",
    "name": "Miel",
    "brand": null,
    "calories": 300,
    "protein": 0.3,
    "carbs": 82,
    "fat": 0,
    "group": "CARB",
    "isVegan": false,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 15,
    "portionName": "cucharada (15g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
  },
  {
    "id": "std-vinagre-vino",
    "name": "Vinagre de vino",
    "brand": null,
    "calories": 19,
    "protein": 0.1,
    "carbs": 0.6,
    "fat": 0,
    "group": "Otros",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 10,
    "portionName": "cucharada (10ml)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-vinagre-modena",
    "name": "Vinagre de Módena",
    "brand": null,
    "calories": 90,
    "protein": 0.5,
    "carbs": 20,
    "fat": 0,
    "group": "CARB",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": false,
    "allergens": [],
    "styles": [
      "MEDITERRANEAN",
      "QUICK"
    ],
    "portionSize": 10,
    "portionName": "cucharada (10ml)",
    "meals": [
      "LUNCH",
      "DINNER"
    ]
  },
  {
    "id": "std-cacao-polvo",
    "name": "Cacao en polvo",
    "brand": null,
    "calories": 350,
    "protein": 22,
    "carbs": 12,
    "fat": 11,
    "group": "Otros",
    "isVegan": true,
    "isVegetarian": true,
    "isKeto": true,
    "allergens": [],
    "styles": [
      "QUICK"
    ],
    "portionSize": 10,
    "portionName": "cucharada (10g)",
    "meals": [
      "BREAKFAST",
      "SNACK"
    ]
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
    if (dietType === "KETO" && !food.isKeto) {
      // In Keto, restrict any food not marked keto-friendly — not just the CARB group.
      // High-carb vegetables (onion, carrot, garlic...) and fruit are flagged isKeto: false
      // in the catalog for exactly this reason; scoping the check to CARB let them through.
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
    
    // Realistic maximum portion caps per food type (in grams)
    // These prevent the solver from prescribing absurd quantities
    let maxGrams = 600; // generous default
    if (f.group === "FAT") maxGrams = 60;  // oils, nuts, avocado
    if (f.id === "std-aceite-oliva" || f.id === "std-aceite-girasol") maxGrams = 30; // max 3 tbsp oil
    if (f.id === "std-mantequilla" || f.id === "std-margarina") maxGrams = 30;
    if (f.id === "std-aguacate") maxGrams = 200; // half a large avocado
    if (f.id === "std-crema-cacahuete") maxGrams = 40;
    // Drinks: cap at 300ml for breakfast and snacks
    const drinkIds = ["std-leche-entera","std-leche-semidesnatada","std-leche-desnatada",
      "std-bebida-avena","std-bebida-soja","std-bebida-almendra","std-kefir","std-leche-cabra"];
    if (drinkIds.includes(f.id)) maxGrams = 300;
    // Protein foods: reasonable single-serving caps
    if (f.id === "std-huevo-entero") maxGrams = 300; // max ~5 eggs
    if (f.id === "std-clara-huevo") maxGrams = 250; // max ~7 egg whites
    if (f.id === "std-tofu") maxGrams = 400;
    if (f.id === "std-proteina-suero" || f.id === "std-proteina-vegana") maxGrams = 80; // max ~2.5 scoops
    // Yogurt / dairy protein
    if (f.id === "std-yogur-griego" || f.id === "std-yogur-natural") maxGrams = 400;
    if (f.id === "std-queso-batido" || f.id === "std-queso-fresco") maxGrams = 400;
    if (f.id === "std-queso-cottage") maxGrams = 400;
    // Cheese: small amounts
    if (f.id === "std-queso-tierno" || f.id === "std-queso-burgos") maxGrams = 200;
    
    // Realistic minimum portions to avoid microscopic grams
    let minGrams = 10;
    if (f.group === "PROTEIN") {
      if (f.id === "std-huevo-entero") minGrams = 60; // 1 egg
      else if (f.id === "std-clara-huevo") minGrams = 100;
      else if (f.id.includes("proteina-")) minGrams = 20;
      else if (f.id.includes("yogur") || f.id.includes("queso-batido") || f.id === "std-queso-cottage" || f.id === "std-queso-fresco" || f.id === "std-queso-burgos") minGrams = 100;
      else minGrams = 80; // chicken, beef, fish
    } else if (f.group === "CARB") {
      if (f.id === "std-avena") minGrams = 30;
      else if (f.id.includes("pan-")) minGrams = 30; // 1 slice
      else if (f.id === "std-galletas-maria") minGrams = 20; // 4 cookies
      else if (f.id.includes("tortitas-")) minGrams = 20;
      else minGrams = 85; // cooked rice, pasta, potato, sweet potato, lentils
    } else if (f.group === "FAT") {
      if (f.id === "std-aguacate") minGrams = 50; // quarter avocado
      else if (f.id === "std-crema-cacahuete") minGrams = 15;
      else if (f.id === "std-aceite-oliva" || f.id === "std-aceite-girasol") minGrams = 5;
      else if (f.id === "std-mantequilla" || f.id === "std-margarina") minGrams = 10;
      else minGrams = 15; // nuts
    }

    let qty = 0;
    if (wUnits > 0) {
      qty = Math.max(minGrams, Math.min(Math.round(wUnits * 100), maxGrams));
    }

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

  // Sum actual calories of the result
  let totalSolvedCals = 0;
  result.forEach(item => {
    totalSolvedCals += item.calories;
  });

  // If solved calories deviate from target by more than 20 kcal (over from maxGrams
  // caps, or under from minGrams floors in addDynamicItem), rescale dynamic items to
  // compensate in either direction.
  if (Math.abs(totalSolvedCals - targetCalories) > 20) {
    const fixedCals = fixedCalories;
    const targetDynCals = Math.max(50, targetCalories - fixedCals);
    const actualDynCals = Math.max(50, totalSolvedCals - fixedCals);
    const scale = targetDynCals / actualDynCals;

    result.forEach(item => {
      if (item.food.group !== "VEG" && item.food.group !== "FRUIT") {
        item.quantityGrams = Math.round(item.quantityGrams * scale);
        item.calories = Math.round((item.food.calories * item.quantityGrams) / 100);
        item.protein = Math.round(((item.food.protein * item.quantityGrams) / 100) * 10) / 10;
        item.carbs = Math.round(((item.food.carbs * item.quantityGrams) / 100) * 10) / 10;
        item.fat = Math.round(((item.food.fat * item.quantityGrams) / 100) * 10) / 10;
        item.equivalentText = getPortionEquivalent(item.food, item.quantityGrams);
      }
    });
  }

  return result;
}

// 3. Culinary Portion Descriptors (Portion Equivalents)
export function formatHumanFraction(value: number, nounSingle: string, nounPlural: string, gender: "m" | "f"): string {
  const rounded = Math.round(value * 2) / 2;
  let text = "";
  
  if (rounded <= 0.5) {
    text = gender === "m" ? `medio ${nounSingle}` : `media ${nounSingle}`;
  } else if (rounded === 1) {
    text = gender === "m" ? `un ${nounSingle}` : `una ${nounSingle}`;
  } else if (rounded === 1.5) {
    text = gender === "m" ? `un ${nounSingle} y medio` : `una ${nounSingle} y media`;
  } else {
    const wholePart = Math.floor(rounded);
    const hasHalf = rounded % 1 !== 0;
    
    let numberWord = "";
    switch (wholePart) {
      case 2: numberWord = "dos"; break;
      case 3: numberWord = "tres"; break;
      case 4: numberWord = "cuatro"; break;
      case 5: numberWord = "cinco"; break;
      default: numberWord = wholePart.toString();
    }
    
    if (hasHalf) {
      text = gender === "m" ? `${numberWord} ${nounPlural} y medio` : `${numberWord} ${nounPlural} y media`;
    } else {
      text = `${numberWord} ${nounPlural}`;
    }
  }

  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getPortionEquivalent(food: DietFood, grams: number): string {
  if (grams <= 0) return "0g";

  // IDs below must match the Spanish slugs used in STANDARD_FOODS — the catalog has
  // no English-slug entries, so mismatched cases here silently never match and fall
  // through to the generic "Xg" text below.
  switch (food.id) {
    case "std-avena":
      if (grams < 30) return "3 cucharadas soperas";
      if (grams <= 60) return "1 taza mediana";
      return formatHumanFraction(grams / 50, "taza de avena en copos", "tazas de avena en copos", "f");
    case "std-pechuga-pollo":
      return formatHumanFraction(grams / 150, "pechuga mediana", "pechugas medianas", "f");
    case "std-arroz-integral":
    case "std-arroz-blanco":
      return formatHumanFraction(grams / 150, "taza de arroz cocido", "tazas de arroz cocido", "f");
    case "std-huevo-entero":
      return formatHumanFraction(grams / 60, "huevo entero", "huevos enteros", "m");
    case "std-clara-huevo":
      return formatHumanFraction(grams / 33, "clara de huevo", "claras de huevo", "f");
    case "std-salmon":
      return formatHumanFraction(grams / 150, "filete de salmón", "filetes de salmón", "m");
    case "std-atun":
      return formatHumanFraction(grams / 80, "lata de atún", "latas de atún", "f");
    case "std-tofu":
      return `${grams}g de tofu`;
    case "std-pan-integral":
      return formatHumanFraction(grams / 35, "rebanada de pan integral", "rebanadas de pan integral", "f");
    case "std-patata":
      return formatHumanFraction(grams / 200, "patata mediana", "patatas medianas", "f");
    case "std-aguacate":
      return formatHumanFraction(grams / 200, "aguacate", "aguacates", "m");
    case "std-aceite-oliva":
      if (grams < 8) return "1 cucharadita de café";
      if (grams <= 15) return "1 cucharada sopera";
      return formatHumanFraction(grams / 10, "cucharada sopera de aceite de oliva", "cucharadas soperas de aceite de oliva", "f");
    case "std-nueces":
      return formatHumanFraction(grams / 3, "nuez", "nueces", "f");
    case "std-crema-cacahuete":
      if (grams < 12) return "1 cucharadita pequeña";
      return formatHumanFraction(grams / 15, "cucharada colmada de crema de cacahuete", "cucharadas colmadas de crema de cacahuete", "f");
    case "std-leche-desnatada":
    case "std-bebida-almendra":
      return formatHumanFraction(grams / 200, "vaso de leche", "vasos de leche", "m");
    case "std-yogur-griego":
      return formatHumanFraction(grams / 125, "vaso de yogur griego", "vasos de yogur griego", "m");
    case "std-queso-batido":
      return formatHumanFraction(grams / 250, "tarrina de queso fresco batido", "tarrinas de queso fresco batido", "f");
    case "std-platano":
      return formatHumanFraction(grams / 100, "plátano", "plátanos", "m");
    case "std-manzana":
      return formatHumanFraction(grams / 150, "manzana", "manzanas", "f");
    case "std-brocoli":
      return `${grams}g de brócoli`;
    case "std-espinacas":
      return formatHumanFraction(grams / 50, "taza de hojas de espinaca", "tazas de hojas de espinaca", "f");
    case "std-proteina-suero":
    case "std-proteina-vegana":
      return formatHumanFraction(grams / 30, "cazo de proteína", "cazos de proteína", "m");
    case "std-pasta":
      return formatHumanFraction(grams / 150, "plato hondo de pasta cocida", "platos hondos de pasta cocida", "m");
    case "std-pechuga-pavo":
      return formatHumanFraction(grams / 150, "filete de pavo", "filetes de pavo", "m");
    case "std-ternera":
      return `${grams}g de ternera magra`;
    case "std-merluza":
      return `${grams}g de lomo de merluza`;
    case "std-boniato":
      return formatHumanFraction(grams / 150, "boniato mediano", "boniatos medianos", "m");
    case "std-quinoa":
      return formatHumanFraction(grams / 150, "taza de quinoa cocida", "tazas de quinoa cocida", "f");
    case "std-lentejas":
      return formatHumanFraction(grams / 150, "plato de lentejas cocidas", "platos de lentejas cocidas", "m");
    case "std-almendras":
      return formatHumanFraction(grams / 1.3, "almendra", "almendras", "f");
    case "std-fresa":
      return formatHumanFraction(grams / 8, "fresa grande", "fresas grandes", "f");
    case "std-arandanos":
      return `${grams}g de arándanos`;
    case "std-calabacin":
      return `${grams}g de calabacín`;
    case "std-queso-cottage":
      return formatHumanFraction(grams / 150, "taza de queso cottage", "tazas de queso cottage", "f");
    default:
      return `${grams}g`;
  }
}

// 4. Culinary Styles Meals Templates
export function getMealTemplate(
  mealType: string,
  style: string,
  availableFoods: DietFood[],
  prioritizedFoodIds: string[] = [],
  usedFoodIds: string[] = []
): {
  carb?: DietFood;
  protein?: DietFood;
  fat?: DietFood;
  veg?: DietFood;
  fruit?: DietFood;
} {
  // Normalize mealType for dynamic snack numbers (e.g. SNACK-1, SNACK-2 -> SNACK)
  const normMealType = mealType.startsWith("SNACK") ? "SNACK" : mealType;

  /**
   * Picks a food from a curated whitelist of IDs.
   * Priority order: user-preferred → not-recently-used → random from pool.
   * Falls back to STANDARD_FOODS if availableFoods has none of the IDs.
   */
  const pickFromPool = (ids: string[], fallbackId: string): DietFood | undefined => {
    // Filter only available (not excluded) foods that are in our curated pool
    let pool = availableFoods.filter((f) => ids.includes(f.id));
    if (pool.length === 0) {
      // Fall back within the already allergy/diet-filtered `availableFoods`, never the raw
      // STANDARD_FOODS catalog — that would bypass the caller's safety filtering entirely.
      return availableFoods.find((f) => f.id === fallbackId) ?? availableFoods[Math.floor(Math.random() * availableFoods.length)];
    }

    // Prefer foods the user has marked as favourite
    const preferredPool = pool.filter((f) => prioritizedFoodIds.includes(f.id));
    if (preferredPool.length > 0) {
      pool = preferredPool;
    } else {
      // Avoid repeating the same food day-to-day
      const freshPool = pool.filter((f) => !usedFoodIds.includes(f.id));
      if (freshPool.length > 0) pool = freshPool;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  };

  /** Pick any vegetable appropriate for the given meal type */
  const pickVeg = (type: string, fallbackId: string): DietFood | undefined => {
    const normType = type.startsWith("SNACK") ? "SNACK" : type;
    // Exclude raw-only vegetables from hot meals and condiment-type foods
    const rawOnlyIds = ["std-ajo", "std-rabano", "std-apio", "std-pepino", "std-esparrago-blanco"];
    let pool = availableFoods.filter(
      (f) => f.group === "VEG" && f.meals.includes(normType as any) && !rawOnlyIds.includes(f.id)
    );
    if (pool.length === 0) pool = availableFoods.filter((f) => f.group === "VEG" && !rawOnlyIds.includes(f.id));
    const freshPool = pool.filter((f) => !usedFoodIds.includes(f.id));
    if (freshPool.length > 0) pool = freshPool;
    // Fall back within `availableFoods` (already allergy/diet filtered), never the raw catalog.
    if (pool.length === 0) return availableFoods.find((f) => f.id === fallbackId);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /** Pick any fruit */
  const pickFruit = (fallbackId: string): DietFood | undefined => {
    // Exclude dried fruits from main breakfast (too calorie-dense for fruit slot)
    const lightFruitIds = [
      "std-platano","std-manzana","std-pera","std-naranja","std-mandarina",
      "std-fresa","std-arandanos","std-frambuesas","std-pina","std-sandia",
      "std-melon","std-melocototon","std-nectarina","std-albaricoque",
      "std-cerezas","std-ciruela","std-uva","std-mango","std-kiwi",
      "std-pomelo","std-granada","std-paraguayo","std-higo","std-caqui",
      "std-nispero","std-chirimoya"
    ];
    let pool = availableFoods.filter((f) => lightFruitIds.includes(f.id));
    if (pool.length === 0) pool = availableFoods.filter((f) => f.group === "FRUIT");
    const freshPool = pool.filter((f) => !usedFoodIds.includes(f.id));
    if (freshPool.length > 0) pool = freshPool;
    // Fall back within `availableFoods` (already allergy/diet filtered), never the raw catalog.
    if (pool.length === 0) return availableFoods.find((f) => f.id === fallbackId);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  switch (normMealType) {
    case "BREAKFAST": {
      // 1. Determine which food groups are available to build valid profiles
      const hasBread = availableFoods.some(f => [
        "std-pan-integral", "std-pan-centeno", "std-pan-espelta", "std-pan-molde"
      ].includes(f.id));
      const hasOats = availableFoods.some(f => f.id === "std-avena");
      const hasYogurt = availableFoods.some(f => [
        "std-yogur-griego", "std-queso-batido", "std-queso-cottage"
      ].includes(f.id));

      const validProfiles: string[] = [];
      if (hasOats) validProfiles.push("OATMEAL");
      if (hasBread) validProfiles.push("TOAST");
      if (hasYogurt) validProfiles.push("YOGURT_BOWL");

      // Default fallback profile
      let profile = "TOAST"; 
      if (validProfiles.length > 0) {
        profile = validProfiles[Math.floor(Math.random() * validProfiles.length)];
      }

      let carb: DietFood | undefined;
      let protein: DietFood | undefined;
      let fat: DietFood | undefined;
      let fruit: DietFood | undefined = pickFruit("std-platano");

      if (profile === "OATMEAL") {
        // Oatmeal bowl: Oats + Dairy/Shake + Nuts/Peanut Butter
        carb = pickFromPool(["std-avena"], "std-avena");
        protein = pickFromPool([
          "std-yogur-griego", "std-queso-batido", "std-queso-cottage",
          "std-proteina-suero", "std-proteina-vegana",
          "std-leche-entera", "std-leche-semidesnatada", "std-leche-desnatada",
          "std-bebida-avena", "std-bebida-soja", "std-kefir"
        ], "std-yogur-griego");
        fat = pickFromPool([
          "std-nueces", "std-almendras", "std-avellanas", "std-pistachos",
          "std-cacahuetes", "std-anacardos", "std-crema-cacahuete"
        ], "std-nueces");
      } 
      else if (profile === "TOAST") {
        // Savory/Toast breakfast: Bread + Eggs/Cheese + Olive oil/Butter/Avocado
        carb = pickFromPool([
          "std-pan-integral", "std-pan-centeno", "std-pan-espelta", "std-pan-molde"
        ], "std-pan-integral");
        protein = pickFromPool([
          "std-huevo-entero", "std-clara-huevo",
          "std-queso-fresco", "std-queso-cottage", "std-queso-burgos", "std-queso-tierno"
        ], "std-huevo-entero");
        fat = pickFromPool([
          "std-aceite-oliva", "std-mantequilla", "std-aguacate"
        ], "std-aceite-oliva");
      } 
      else { // YOGURT_BOWL
        // Yogurt bowl: Greek yogurt/Queso batido + Oats/Galletas + Nuts/Peanut butter
        protein = pickFromPool([
          "std-yogur-griego", "std-queso-batido", "std-queso-cottage"
        ], "std-yogur-griego");
        carb = pickFromPool([
          "std-avena", "std-galletas-maria", "std-tortitas-arroz"
        ], "std-avena");
        fat = pickFromPool([
          "std-nueces", "std-almendras", "std-avellanas", "std-pistachos",
          "std-cacahuetes", "std-anacardos", "std-crema-cacahuete"
        ], "std-nueces");
      }

      // Safeguard: If the selected profile yielded nothing for a key slot (e.g. Keto restricts oats/bread),
      // search for any item of that group in the available pool to prevent empty slots.
      if (!carb && availableFoods.some(f => f.group === "CARB")) {
        carb = availableFoods.find(f => f.group === "CARB");
      }
      if (!protein && availableFoods.some(f => f.group === "PROTEIN")) {
        protein = availableFoods.find(f => f.group === "PROTEIN");
      }
      if (!fat && availableFoods.some(f => f.group === "FAT")) {
        fat = availableFoods.find(f => f.group === "FAT");
      }

      return { carb, protein, fat, fruit };
    }

    case "LUNCH": {
      /**
       * Main midday meal: starch + lean protein + vegetable + olive oil
       *
       * CARB slot   → rice / pasta / potatoes / legumes / bread
       * PROTEIN slot → chicken / turkey / beef / fish / eggs / legumes
       * VEG slot    → any vegetable (160g portion)
       * FAT slot    → olive oil (main), occasionally avocado
       *
       * Coherent combos that arise:
       *   Arroz + Pechuga de pollo + Brócoli + Aceite de oliva
       *   Lentejas + Merluza + Espinacas + Aceite de oliva
       *   Pasta + Ternera magra + Champiñones + Aceite de oliva
       *   Patatas + Salmón + Judías verdes + Aceite de oliva
       */

      // CARB = complex starch (no drinks, no sweets)
      const lunchCarbPool = [
        "std-arroz-integral","std-arroz-blanco","std-arroz-basmati","std-arroz-bomba",
        "std-pasta",
        "std-patata","std-boniato",
        "std-lentejas","std-garbanzos","std-alubias-blancas","std-alubias-pintas",
        "std-lenteja-roja",
        "std-quinoa","std-cuscus",
        "std-pan-integral","std-pan-centeno",
      ];

      // PROTEIN = lean meat, fish, eggs, legumes (NOT cured meats / cold cuts)
      const lunchProteinPool = [
        // Poultry
        "std-pechuga-pollo","std-pechuga-pavo","std-muslo-pollo","std-alitas-pollo",
        // Red meat
        "std-lomo-cerdo","std-ternera","std-entrecot-ternera","std-chuleta-cerdo","std-conejo","std-cordero",
        // Fish & seafood
        "std-salmon","std-merluza","std-atun","std-bacalao","std-dorada","std-lubina",
        "std-trucha","std-lenguado","std-sardinas","std-gambas","std-langostinos",
        "std-pulpo","std-calamares","std-chipirones","std-sepia","std-cigalas",
        // Eggs / plant
        "std-huevo-entero","std-tofu","std-seitan",
      ];

      // FAT = almost always olive oil; avocado occasionally
      const lunchFatPool = [
        "std-aceite-oliva",
        "std-aceite-oliva",  // double weight → more likely
        "std-aceite-oliva",
        "std-aguacate",
      ];

      return {
        carb: pickFromPool(lunchCarbPool, "std-arroz-integral"),
        protein: pickFromPool(lunchProteinPool, "std-pechuga-pollo"),
        veg: pickVeg("LUNCH", "std-brocoli"),
        fat: pickFromPool(lunchFatPool, "std-aceite-oliva"),
      };
    }

    case "DINNER": {
      /**
       * Lighter evening meal: protein (preferably fish/eggs) + vegetable + light carb + olive oil
       *
       * CARB slot   → light starch (potato, bread, small rice, legumes)
       * PROTEIN slot → fish / eggs preferred; light chicken; tofu
       * VEG slot    → any vegetable
       * FAT slot    → olive oil
       *
       * Coherent combos:
       *   Patatas + Salmón + Espinacas + Aceite de oliva
       *   Pan integral + Huevos + Brócoli + Aceite de oliva
       *   Lentejas + Merluza + Judías verdes + Aceite de oliva
       */

      // CARB = lighter starch options for dinner
      const dinnerCarbPool = [
        "std-patata","std-boniato",
        "std-pan-integral","std-pan-centeno","std-pan-espelta",
        "std-arroz-integral","std-arroz-blanco","std-arroz-basmati",
        "std-lentejas","std-garbanzos","std-lenteja-roja",
        "std-pasta",
        "std-quinoa","std-cuscus",
      ];

      // PROTEIN = fish and eggs strongly preferred for dinner; chicken OK
      const dinnerProteinPool = [
        // Fish (repeated for higher probability)
        "std-salmon","std-salmon","std-merluza","std-merluza",
        "std-bacalao","std-dorada","std-lubina","std-trucha","std-lenguado",
        "std-atun","std-sardinas","std-gambas","std-langostinos","std-pulpo",
        "std-calamares","std-chipirones","std-sepia",
        // Eggs (also very common for dinner in Spain)
        "std-huevo-entero","std-huevo-entero","std-clara-huevo",
        // Light chicken
        "std-pechuga-pollo","std-pechuga-pavo",
        // Plant protein
        "std-tofu","std-seitan",
        // Light lean beef
        "std-ternera","std-lomo-cerdo",
      ];

      // FAT = olive oil
      const dinnerFatPool = [
        "std-aceite-oliva","std-aceite-oliva","std-aceite-oliva",
        "std-aguacate",
      ];

      return {
        carb: pickFromPool(dinnerCarbPool, "std-patata"),
        protein: pickFromPool(dinnerProteinPool, "std-salmon"),
        veg: pickVeg("DINNER", "std-espinacas"),
        fat: pickFromPool(dinnerFatPool, "std-aceite-oliva"),
      };
    }

    case "SNACK": {
      /**
       * Between-meal snack: fruit + dairy/protein + nuts
       *
       * FRUIT slot   → any light fruit
       * PROTEIN slot → yogur, cottage cheese, queso fresco, protein shake, kéfir
       * FAT slot     → nuts, seeds, dark chocolate, crema de cacahuete
       *
       * Coherent combos:
       *   Manzana + Yogur griego + Nueces
       *   Plátano + Queso cottage + Almendras
       *   Naranja + Proteína de suero + Cacahuetes
       */

      // PROTEIN/DAIRY for snack
      const snackProteinPool = [
        "std-yogur-griego","std-yogur-natural","std-queso-batido",
        "std-queso-fresco","std-queso-cottage","std-queso-burgos","std-queso-tierno",
        "std-proteina-suero","std-proteina-vegana",
        "std-kefir","std-leche-semidesnatada",
        "std-huevo-entero","std-clara-huevo",
      ];

      // FAT for snack = nuts and seeds (no oils for snack)
      const snackFatPool = [
        "std-nueces","std-almendras","std-avellanas","std-pistachos",
        "std-cacahuetes","std-anacardos",
        "std-crema-cacahuete",
        "std-chocolate-negro-85",
        "std-pipas-girasol","std-pipas-calabaza",
      ];

      return {
        protein: pickFromPool(snackProteinPool, "std-yogur-griego"),
        fat: pickFromPool(snackFatPool, "std-nueces"),
        fruit: pickFruit("std-manzana"),
      };
    }

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
  prioritizedFoodIds: string[] = [],
  mealsConfig: string | null = null
): MealPlan[] {
  // Pre-filter catalog
  let filteredFoods = filterFoodsForUser(STANDARD_FOODS, dietType, allergensList);

  // Apply custom food exclusions
  if (excludedFoodIds.length > 0) {
    filteredFoods = filteredFoods.filter((f) => !excludedFoodIds.includes(f.id));
  }

  // Parse custom allocations or fall back to default
  let mealAllocations = [
    { type: "BREAKFAST", label: "Desayuno", pct: 0.25 },
    { type: "LUNCH", label: "Almuerzo", pct: 0.35 },
    { type: "DINNER", label: "Cena", pct: 0.25 },
    { type: "SNACK", label: "Snacks", pct: 0.15 },
  ];

  if (mealsConfig) {
    const parts = mealsConfig.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      const snacks = parts.filter(p => p === "SNACK" || p.startsWith("SNACK-"));
      const numSnacks = snacks.length;

      let pctBreakfast = 0.25;
      let pctLunch = 0.35;
      let pctDinner = 0.25;
      let pctSnacksTotal = 0.15;

      if (numSnacks === 0) {
        pctBreakfast = 0.30;
        pctLunch = 0.40;
        pctDinner = 0.30;
        pctSnacksTotal = 0;
      }

      let snackCount = 0;
      mealAllocations = parts.map(id => {
        let pct = 0;
        let label = "";
        if (id === "BREAKFAST") {
          pct = pctBreakfast;
          label = "Desayuno";
        } else if (id === "LUNCH") {
          pct = pctLunch;
          label = "Almuerzo";
        } else if (id === "DINNER") {
          pct = pctDinner;
          label = "Cena";
        } else if (id === "SNACK") {
          pct = pctSnacksTotal;
          label = "Snacks";
        } else if (id.startsWith("SNACK-")) {
          snackCount++;
          pct = numSnacks > 0 ? pctSnacksTotal / numSnacks : 0;
          label = `Snack ${snackCount}`;
        } else {
          pct = 0.10;
          label = id;
        }
        return { type: id, label, pct };
      });

      // Normalize percentages to sum to exactly 1.0
      const totalPct = mealAllocations.reduce((acc, m) => acc + m.pct, 0);
      if (totalPct > 0) {
        mealAllocations.forEach(m => {
          m.pct = m.pct / totalPct;
        });
      }
    }
  }

  const usedFoodIds: string[] = [];

  return mealAllocations.map((alloc) => {
    const mealCals = Math.round(targetCalories * alloc.pct);
    const mealPro = Math.round(targetProtein * alloc.pct);
    const mealCarbs = Math.round(targetCarbs * alloc.pct);
    const mealFat = Math.round(targetFat * alloc.pct);

    const template = getMealTemplate(alloc.type, culinaryStyle, filteredFoods, prioritizedFoodIds, usedFoodIds);
    
    // Add chosen foods to used list
    Object.values(template).forEach((food) => {
      if (food) usedFoodIds.push(food.id);
    });

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
