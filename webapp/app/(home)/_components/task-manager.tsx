"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Accordion } from "radix-ui";
import { useEffect, useRef } from "react";
import { Task } from "./task";
import { TaskManagerTitle } from "./task-manager-title";

function TaskManager(props: { tasks: Array<TaskInfo> }) {
  const hasMounted = useRef(true);

  useEffect(() => {
    hasMounted.current = false;
  }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        className="relative mb-2"
      >
        <TaskManagerTitle />
      </motion.div>
      <div className="w-full">
        <Accordion.Root type="multiple" className="AccordionRoot">
          <AnimatePresence initial={true}>
            {props.tasks.map((task_info, i) => (
              <Task
                key={task_info.name}
                delay={hasMounted.current ? i * 0.4 + 0.4 : 0.0}
                info={task_info}
              />
            ))}
          </AnimatePresence>
        </Accordion.Root>
      </div>
    </div>
  );
}

export { TaskManager };
