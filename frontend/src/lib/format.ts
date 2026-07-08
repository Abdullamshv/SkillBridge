export function formatRM(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return "RM " + n.toLocaleString("en-MY", { maximumFractionDigits: 0 });
}

export function postedAgo(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function dueInDays(isoDate: string): string {
  const days = Math.ceil(
    (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return "Deadline passed";
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// Deterministic gradient per name, matching the prototype's per-brand avatar colors.
const GRADIENTS = [
  "linear-gradient(135deg,#4E3FE3,#7B62F2)",
  "linear-gradient(135deg,#F0914A,#E86F3A)",
  "linear-gradient(135deg,#8A4EC6,#B06AE0)",
  "linear-gradient(135deg,#1F9D6B,#37B287)",
  "linear-gradient(135deg,#3E4C86,#5B6BB0)",
  "linear-gradient(135deg,#2C8FB8,#4BB3DB)",
  "linear-gradient(135deg,#5C9E31,#7CBF4E)",
  "linear-gradient(135deg,#A8622F,#C98449)",
];

export function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}
