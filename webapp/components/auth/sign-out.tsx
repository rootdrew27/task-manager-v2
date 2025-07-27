import { motion } from "framer-motion";
import { PiSignOutBold } from "react-icons/pi";

export function SignOut() {
  return (
    <motion.button
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 },
      }}
      className="bg-white text-oxford-blue rounded-full control-button p-0 control-button flex items-center justify-center shadow-black/10 shadow-sm hover:cursor-pointer touch-manipulation"
      role="button"
      type="submit"
    >
      <PiSignOutBold className="w-5 h-5" />
    </motion.button>
  );
}
