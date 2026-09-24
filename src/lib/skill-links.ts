import { COURSES, SIMULATIONS, type Competency } from "./data";

const words = (s: string) => s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
const overlaps = (a: string, b: string) => { const wb = words(b); return words(a).some((w) => wb.some((x) => x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5)))); };

/** Existing course that best covers a competency, or undefined. */
export function courseForSkill(c: Competency) {
  return COURSES.find((k) => k.skills.some((s) => s.toLowerCase() === c.name.toLowerCase()))
    ?? COURSES.find((k) => k.skills.some((s) => overlaps(s, c.name)));
}

/** First available simulation practising any of the given skill names. */
export function simForSkills(names: string[]) {
  return SIMULATIONS.find((s) => s.available && s.skills.some((k) => names.some((n) => k.toLowerCase() === n.toLowerCase())))
    ?? SIMULATIONS.find((s) => s.available && s.skills.some((k) => names.some((n) => overlaps(k, n))));
}
