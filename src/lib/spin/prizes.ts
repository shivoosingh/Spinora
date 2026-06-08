export interface WheelPrize {
  id: string;
  label: string;
  type: "cash" | "luck" | "points";
  value: number;
  emoji: string;
  color: string;
  weight: number;
}

export const WHEEL_PRIZES: WheelPrize[] = [
  { id: "20", label: "$20", type: "cash", value: 20, emoji: "🤑", color: "#0a1428", weight: 2 },
  { id: "luck1", label: "GOOD LUCK", type: "luck", value: 0, emoji: "😎", color: "#0c1830", weight: 18 },
  { id: "2", label: "$2", type: "cash", value: 2, emoji: "💵", color: "#0a1428", weight: 16 },
  { id: "3", label: "$3", type: "cash", value: 3, emoji: "🪙", color: "#0c1830", weight: 16 },
  { id: "1", label: "$1", type: "cash", value: 1, emoji: "💲", color: "#0a1428", weight: 20 },
  { id: "luck2", label: "GOOD LUCK", type: "luck", value: 0, emoji: "🍀", color: "#0c1830", weight: 18 },
  { id: "4", label: "$4", type: "cash", value: 4, emoji: "💸", color: "#0a1428", weight: 14 },
  { id: "10", label: "$10", type: "cash", value: 10, emoji: "🎁", color: "#0c1830", weight: 8 },
];

export const DAILY_SPINS_BY_TIER: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 3,
};

export function pickWeightedPrize(): { prize: WheelPrize; index: number } {
  const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    rand -= WHEEL_PRIZES[i].weight;
    if (rand <= 0) return { prize: WHEEL_PRIZES[i], index: i };
  }
  return { prize: WHEEL_PRIZES[0], index: 0 };
}

export function getSpinRotation(prizeIndex: number, currentRotation: number): number {
  const segmentAngle = 360 / WHEEL_PRIZES.length;
  const fullSpins = 5;
  // Segment centers align with conic-gradient (starts at -segmentAngle/2)
  const segmentCenter = prizeIndex * segmentAngle;
  const target = 360 * fullSpins + (360 - segmentCenter);
  return currentRotation + target + Math.random() * 8 - 4;
}
