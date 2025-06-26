import { motion } from "framer-motion";
import { BsGearFill } from "react-icons/bs";

export function Settings() {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.8 }}
      transition={{ duration: 0.4, delay: 0 }}
      className="bg-white rounded-full w-[100px] h-[100px] flex items-center justify-center hover:cursor-pointer"
    >
      <BsGearFill className="text-black h-7 w-7" />
    </motion.button>
  );
}
