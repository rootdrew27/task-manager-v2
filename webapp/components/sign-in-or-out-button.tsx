"use client";

import { SignIn } from "@/components/auth/sign-in";
import { SignOut } from "@/components/auth/sign-out";
import { motion } from "framer-motion";

interface SignInOrOutButtonProps {
  isSignedIn: boolean;
  handleSignOut: () => Promise<void>;
  handleSignIn: () => Promise<void>;
}

export function SignInOrOutButton(props: SignInOrOutButtonProps) {
  return (
    <motion.div
      transition={{ delay: 1 }}
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed top-4 right-4 z-50 bg-walnut-brown border border-primary rounded-full shadow-black/10 shadow-sm p-2"
    >
      <motion.div
        whileTap={{
          scale: 0.8,
          transition: { duration: 0.1, ease: "easeOut" },
        }}
        onTapStart={props.isSignedIn ? props.handleSignOut : props.handleSignIn}
        className="bg-transparent rounded-full p-1 button-wrapper-touch-optimized"
        tabIndex={-1}
      >
        {props.isSignedIn ? <SignOut /> : <SignIn />}
      </motion.div>
    </motion.div>
  );
}
