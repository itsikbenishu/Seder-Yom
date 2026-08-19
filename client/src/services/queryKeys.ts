export const eventKeys = {
  all: ["events"] as const,
  week: () => [...eventKeys.all, "week"] as const,
};
