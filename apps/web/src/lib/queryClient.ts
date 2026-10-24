import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // 1 min — data is fresh for 1 min
      gcTime: 5 * 60_000,       // 5 min cache
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError: (error: unknown) => {
        // Global mutation error: logged, individual components handle toasts
        console.error('[Mutation error]', error);
      },
    },
  },
});
