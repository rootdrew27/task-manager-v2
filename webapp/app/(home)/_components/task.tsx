import { AccordionContentProps, AccordionTriggerProps } from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import { motion } from "framer-motion";
import { Accordion } from "radix-ui";
import * as React from "react";
import { CiCircleCheck } from "react-icons/ci";

function Task(props: { info: TaskInfo; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        duration: 0.6,
        delay: props.delay,
        scale: { type: "spring", visualDuration: 0.4, bounce: 0.6 },
        ease: [0.09, 0.5, 0.245, 1.055],
      }}
      key={props.info.name}
    >
      <Accordion.Item value={props.info.name} className="AccordionItem">
        <AccordionTrigger className="">
          <div className="flex gap-x-2">
            <p>{props.info.name}</p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {props.info.is_complete && <CiCircleCheck className="h-6 w-6" />}
            </motion.div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div>Deadline: {props.info.deadline?.toString()}</div>
          <div>Description: {props.info.description}</div>
        </AccordionContent>
      </Accordion.Item>
    </motion.div>
  );
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Header className="AccordionHeader">
      <Accordion.Trigger
        className={classNames("AccordionTrigger", className)}
        {...props}
        ref={forwardedRef}
      >
        {children}
        <ChevronDownIcon className="AccordionChevron" aria-hidden />
      </Accordion.Trigger>
    </Accordion.Header>
  )
);
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Content
      className={classNames("AccordionContent", className)}
      {...props}
      ref={forwardedRef}
    >
      <div className="AccordionContentText">{children}</div>
    </Accordion.Content>
  )
);
AccordionContent.displayName = "AccordionContent";

export { Task };
