import { AccordionContentProps, AccordionTriggerProps } from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import { Variants, motion } from "framer-motion";
import { Accordion } from "radix-ui";
import * as React from "react";
import { CiCircleCheck } from "react-icons/ci";

// Animation variants for smooth, optimized animations
const taskVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      bounce: 0.1,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      bounce: 0,
    },
  },
};

const checkIconVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.3,
    rotate: 180,
    transition: {
      type: "tween",
      duration: 0.15,
    },
  },
};

function Task(props: { info: TaskInfo; delay: number }) {
  return (
    <motion.div
      variants={taskVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      transition={{
        delay: props.delay,
        type: "spring",
        stiffness: 300,
        damping: 25,
        bounce: 0.1,
        duration: 0.5,
      }}
      key={props.info.name}
      className="w-full motion-optimized"
    >
      <Accordion.Item value={props.info.name} className="AccordionItem bg-primary">
        <AccordionTrigger className="">
          <div className="flex gap-x-2 items-center">
            <p className="font-medium">{props.info.name}</p>
            <motion.div
              variants={checkIconVariants}
              initial="hidden"
              animate={props.info.is_complete ? "visible" : "hidden"}
              className="motion-optimized"
            >
              {props.info.is_complete && <CiCircleCheck className="h-6 w-6 text-green-600" />}
            </motion.div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mb-2">
            <span className="font-medium">Deadline:</span> {props.info.deadline?.toString()}
          </div>
          <div>
            <span className="font-medium">Description:</span> {props.info.description}
          </div>
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
