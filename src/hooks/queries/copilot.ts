/**
 * Clinical Copilot hooks.
 *
 * The Copilot itself is a set of server functions in
 * `src/lib/clinical-copilot.functions.ts`. This module re-exports them
 * plus their types so consumers have a single conventional import path
 * consistent with the other domain modules.
 */
export {
  generateClinicalSummary,
  saveClinicalSummary,
  type ClinicalSummary,
} from "@/lib/clinical-copilot.functions";