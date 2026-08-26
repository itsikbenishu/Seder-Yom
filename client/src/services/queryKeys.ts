export const eventKeys = {
  all: ["events"] as const,
  week: () => [...eventKeys.all, "week"] as const,
};

export const archiveKeys = {
  all: ["archive"] as const,
  list: (search: string) => [...archiveKeys.all, "list", search] as const,
};
