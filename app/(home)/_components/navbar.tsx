"use client";

import { motion } from "framer-motion";

export function Navbar() {
  return (
    <div className="absolute flex justify-center top-0 w-[100vw] z-10 p-6">
      <motion.h1
        className="text-4xl text-white"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{
          delay: 1.0,
          duration: 0.4,
        }}
      >
        Task Manager
      </motion.h1>
      <motion.div className="login-button"></motion.div>
    </div>
  );
}
