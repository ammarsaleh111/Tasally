import month02 from "../month-02/trivia.json";
import month03 from "../month-03/trivia.json";
import month04 from "../month-04/trivia.json";
import month05 from "../month-05/trivia.json";
import month06 from "../month-06/trivia.json";
import month202611 from "../2026-11/trivia.json";
import month202612 from "../2026-12/trivia.json";
import month202701 from "../2027-01/trivia.json";
import month202702 from "../2027-02/trivia.json";
import month202703 from "../2027-03/trivia.json";
import month202704 from "../2027-04/trivia.json";
import month202705 from "../2027-05/trivia.json";
import month202706 from "../2027-06/trivia.json";
import month202707 from "../2027-07/trivia.json";
import month202708 from "../2027-08/trivia.json";
import month202709 from "../2027-09/trivia.json";
import month202710 from "../2027-10/trivia.json";
import month202711 from "../2027-11/trivia.json";
import type { MonthKey, RawMonthDataset } from "../keys";
import { createGameDataLoader } from "../loader";

export const months: Record<MonthKey, RawMonthDataset> = {
  "month-02": month02,
  "month-03": month03,
  "month-04": month04,
  "month-05": month05,
  "month-06": month06,
  "2026-11": month202611,
  "2026-12": month202612,
  "2027-01": month202701,
  "2027-02": month202702,
  "2027-03": month202703,
  "2027-04": month202704,
  "2027-05": month202705,
  "2027-06": month202706,
  "2027-07": month202707,
  "2027-08": month202708,
  "2027-09": month202709,
  "2027-10": month202710,
  "2027-11": month202711,
};

export const loader = createGameDataLoader("trivia", months);
