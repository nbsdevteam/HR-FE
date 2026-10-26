import { useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import type { MyTask } from "./myTasksTypes";

export type { MyTask, MyTaskAction, MyTaskItem } from "./myTasksTypes";

/** Query key prefix — every End of Service write invalidates it, since each one can move a task. */
export const MY_TASKS_KEY = "myTasks";

const NO_TASKS: MyTask[] = [];

/** What is waiting for the signed-in user, with the action to take — a live queue, so it stays short-lived. */
export const useMyTasks = (enabled = true) => {
  const query = useQuery<MyTask[], Error>({
    queryKey: [MY_TASKS_KEY],
    queryFn: odooData.fetchMyTasks,
    enabled,
    staleTime: STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
  });
  return {
    tasks: query.data ?? NO_TASKS,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
