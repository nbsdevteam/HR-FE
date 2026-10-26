import { ListChecks } from "lucide-react";
import { useMyTasks } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import EmptyState from "@/shared/components/EmptyState";
import LoadingState from "@/shared/components/LoadingState";
import MyTaskRow from "../components/MyTaskRow";
import { useMyTaskActions } from "../hooks/useMyTaskActions";
import { lifecycleCardClass } from "../styles/lifecycle";

/**
 * Everything waiting for the signed-in user across End of Service processes, with
 * the action to take. Replaces opening each process through the eye icon to find
 * out whether it needs you: the backend decides who sees what.
 */
const MyTasks = () => {
  const { tasks, loading, error } = useMyTasks();
  const actions = useMyTaskActions();

  if (loading) {
    return <LoadingState message={arabicSource("common.loading")} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-primary" />
          {arabicSource("lifecycle.my_tasks_title")}
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("lifecycle.my_tasks_subtitle")}</p>
      </div>
      {error ? (
        <p className="text-destructive" style={{ fontSize: 13 }}>{arabicSource("lifecycle.my_tasks_load_failed")}</p>
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListChecks} message={arabicSource("lifecycle.my_tasks_empty")} />
      ) : (
        <ul className="space-y-3">
          {tasks.map(task => (
            <MyTaskRow key={`${task.action}-${task.exit_id}`} task={task} actions={actions} cardCls={lifecycleCardClass} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyTasks;
