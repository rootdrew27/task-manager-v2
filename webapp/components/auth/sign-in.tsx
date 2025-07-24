import { motion } from "framer-motion";
import { PiSignInBold } from "react-icons/pi";

export function SignIn() {
  return (
    <motion.button
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 },
      }}
      className="bg-white text-oxford-blue rounded-full control-button p-0 flex items-center justify-center hover:cursor-pointer shadow-black/10 shadow-sm"
      role="button"
      type="submit"
    >
      <PiSignInBold className="w-5 h-5" />
    </motion.button>
  );
}
