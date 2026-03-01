import { z } from "zod";

// Go/No-Go Decision
export const goNoGoSchema = z.object({
  decision: z.enum(["GO", "NO_GO", "REVIEW"], "Veuillez choisir une decision"),
  reason: z.string().optional(),
});

export type GoNoGoFormData = z.infer<typeof goNoGoSchema>;

// Strategy Review
export const strategyReviewSchema = z.object({
  approved_themes: z.array(z.string()).min(1, "Selectionnez au moins un argument"),
  modifications: z.record(z.string(), z.string()).optional(),
  new_themes: z.array(z.string()).optional(),
});

export type StrategyReviewFormData = z.infer<typeof strategyReviewSchema>;

// Price Review
export const priceReviewSchema = z.object({
  adjustments: z.record(z.string(), z.number()).optional(),
  global_discount: z.number().min(0, "La remise ne peut pas etre negative").max(50, "La remise maximale est de 50%"),
  final_total: z.number().min(0, "Le total ne peut pas etre negatif"),
});

export type PriceReviewFormData = z.infer<typeof priceReviewSchema>;

// Tech Review
export const techReviewSchema = z.object({
  edits: z.record(z.string(), z.string()).optional(),
  comment: z.string().optional(),
});

export type TechReviewFormData = z.infer<typeof techReviewSchema>;
