import { getCairoDateKey as getCairoDateKeyFromAllData } from "@/data/all-data/utils/date";

export function getCairoDateKey() {
  return getCairoDateKeyFromAllData();
}

export function dateToCairoKey(date) {
  return getCairoDateKeyFromAllData(date);
}
