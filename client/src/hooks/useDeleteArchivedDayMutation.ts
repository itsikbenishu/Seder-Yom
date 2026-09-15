import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from "@tanstack/react-query";
import type { ArchiveResponseData } from "@project/shared";
import { archiveKeys } from "../services/queryKeys";
import { deleteArchivedDay } from "../services/archive.api";

interface DeleteArchivedDayContext {
  previous: [QueryKey, unknown][];
}

// Cached per search term, so this updates every cached search's pages via the prefix-matching *Queries* APIs.
export function useDeleteArchivedDayMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, DeleteArchivedDayContext>({
    mutationFn: deleteArchivedDay,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: archiveKeys.all });

      const previous = queryClient.getQueriesData({ queryKey: archiveKeys.all });

      queryClient.setQueriesData<InfiniteData<ArchiveResponseData>>({ queryKey: archiveKeys.all }, (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({ ...page, days: page.days.filter((day) => day.id !== id) })),
        },
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: archiveKeys.all });
    },
  });
}
