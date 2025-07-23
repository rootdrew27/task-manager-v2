import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { motion } from "framer-motion";
import React, { Dispatch, SetStateAction, useState } from "react";
import { HiOutlineSparkles } from "react-icons/hi";
import { APIKeyValidationModal } from "./api-key-validation-modal";
import { ModelSelectionModal } from "./model-selection-modal";

export function AgentButton(props: {
  onConnectButtonClicked: () => void;
  setApiKeyValidity: Dispatch<SetStateAction<ApiKeyValidity | null>>;
  apiKeyValidity: ApiKeyValidity | null;
  selectedModels: SelectedModels | null;
}) {
  const [showModals, setShowModals] = useState(false);
  const [isValidConfig] = useState(
    !!(
      props.apiKeyValidity?.stt &&
      props.apiKeyValidity.llm &&
      props.selectedModels?.stt &&
      props.selectedModels.llm
    )
  );

  const areAPIKeysValid = (props.apiKeyValidity?.stt && props.apiKeyValidity.llm) ?? false;

  const onCompleteConfig = () => {
    // setIsValidConfig(true);
    props.onConnectButtonClicked();
  };

  const onClose = () => {
    setShowModals(false);
  };

  const handleOpenModal = () => {
    setShowModals(true);
  };

  if (isValidConfig) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17, duration: 0.5 }}
        className="text-center uppercase bg-white flex items-center justify-center text-black rounded-full h-[50px] w-[50px]"
        onClick={() => props.onConnectButtonClicked()}
      >
        <motion.span className="inline-block">
          <HiOutlineSparkles />
        </motion.span>
        {/* <RiChatVoiceAiLine className="text-gray-600 h-6 w-6" /> */}
      </motion.button>
    );
  } else {
    return (
      <>
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => handleOpenModal()}
          transition={{ duration: 0.4, delay: 0 }}
          className="text-center uppercase bg-white flex items-center justify-center rounded-full h-[50px] w-[50px]"
        >
          <motion.span className="inline-block">
            {/* <RiChatVoiceAiLine className="text-gray-600 h-6 w-6" /> */}
            <HiOutlineSparkles className="h-5 w-5 text-gray-600" />
          </motion.span>
        </motion.button>
        {showModals &&
          (!areAPIKeysValid ? (
            <APIKeyValidationModal
              apiKeyValidity={props.apiKeyValidity}
              setApiKeyValidity={props.setApiKeyValidity}
              onClose={onClose}
            />
          ) : (
            <ModelSelectionModal
              withCartesia={!!props.apiKeyValidity?.tts}
              selectedModels={props.selectedModels}
              onComplete={onCompleteConfig}
              onClose={onClose}
            />
          ))}
      </>
    );
  }
}
