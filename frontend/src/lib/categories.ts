export const TASK_CATEGORIES: { value: string; label: string }[] = [
  { value: "graphic_design", label: "Graphic Design" },
  { value: "content_writing", label: "Content Writing" },
  { value: "social_media", label: "Social Media" },
  { value: "web_dev", label: "Web Dev" },
  { value: "data", label: "Data" },
];

export const STUDENT_CATEGORIES: { value: string; label: string }[] = [
  { value: "Design", label: "Design" },
  { value: "Writing", label: "Writing" },
  { value: "Social Media", label: "Social Media" },
  { value: "Web", label: "Web" },
  { value: "Data", label: "Data" },
  { value: "Video", label: "Video" },
];

export function taskCategoryLabel(value: string): string {
  return TASK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const PRICE_OPTS: { label: string; min?: string; max?: string }[] = [
  { label: "Any price" },
  { label: "Under RM 400", max: "399.99" },
  { label: "RM 400–800", min: "400", max: "800" },
  { label: "RM 800+", min: "800.01" },
];

export const SPRICE_OPTS: { label: string; min?: string; max?: string }[] = [
  { label: "Any price" },
  { label: "Under RM 500", max: "499.99" },
  { label: "RM 500–1,000", min: "500", max: "1000" },
  { label: "RM 1,000+", min: "1000.01" },
];

export const RATE_OPTS: { label: string; min?: number }[] = [
  { label: "Any rating" },
  { label: "4.8+", min: 4.8 },
  { label: "4.5+", min: 4.5 },
];

export const SORT_OPTS: { label: string; value: string }[] = [
  { label: "Newest", value: "new" },
  { label: "Highest pay", value: "price" },
];
