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
      <motion.div
        whileTap={{ scale: 0.8, transition: { duration: 0.1, ease: "easeOut" } }}
        style={{
          minWidth: "54px", // Maintains hit area (50px button + 4px padding)
          minHeight: "54px",
          touchAction: "manipulation", // Prevents zoom on mobile
        }}
        onTapStart={() => props.onConnectButtonClicked()}
        className="bg-transparent rounded-full hover:cursor-auto p-2"
        tabIndex={-1}
      >
        <motion.button
          whileHover={{
            scale: 1.1,
            transition: { duration: 0.2 },
          }}
          style={{
            touchAction: "manipulation", // Prevents zoom on mobile
          }}
          className="control-button flex items-center justify-center rounded-full hover:cursor-pointer hover:bg-secondary/10"
        >
          <HiOutlineSparkles className="h-5 w-5 text-oxford-blue" />
        </motion.button>
        {/* <RiChatVoiceAiLine className="text-gray-600 h-6 w-6" /> */}
      </motion.div>
    );
  } else {
    return (
      <>
        <motion.div
          whileTap={{
            scale: 0.8,
            transition: { duration: 0.1, ease: "easeOut" },
          }}
          style={{
            minWidth: "54px", // Maintains hit area (50px button + 4px padding)
            minHeight: "54px",
            touchAction: "manipulation", // Prevents zoom on mobile
          }}
          onClick={handleOpenModal}
          className="bg-transparent rounded-full"
        >
          <motion.button
            whileHover={{
              scale: 1.1,
              transition: { duration: 0.2 },
            }}
            style={{
              touchAction: "manipulation", // Prevents zoom on mobile
            }}
            className="bg-primary flex items-center justify-center rounded-full control-button shadow-black/10 shadow-sm hover:cursor-pointer"
          >
            {/* <RiChatVoiceAiLine className="text-gray-600 h-6 w-6" /> */}
            <HiOutlineSparkles className="h-5 w-5 text-gray-600" />
          </motion.button>
        </motion.div>
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
