
import React, { useState } from "react";
import { motion } from "framer-motion";
import { RiChatVoiceAiLine } from "react-icons/ri";
import { APIKeyValidationModal } from "./api-key-validation-modal";

export function AgentButton(props: {onConnectButtonClicked: () => void}) {
  const [isValidConfig, setIsValidConfig] = useState(false);

  if (isValidConfig){
    return (
      <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="text-center uppercase bg-white flex items-center justify-center text-black rounded-full h-[50px] w-[50px]"
          onClick={() => props.onConnectButtonClicked()}
        >
          <RiChatVoiceAiLine className="h-6 w-6" />
      </motion.button>
    )
  }
  else {
    return (
      <APIKeyValidationModal setConfigStatus={setIsValidConfig}>
        <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.8 }}
            transition={{ duration: 0.4, delay: 0 }}
            className="text-center uppercase bg-white flex items-center justify-center text-black rounded-full h-[50px] w-[50px]"
          >
            <RiChatVoiceAiLine className="h-6 w-6" />
        </motion.button>
      </APIKeyValidationModal>
    )
  }
} 



