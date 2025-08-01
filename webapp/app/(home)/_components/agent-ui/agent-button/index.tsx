import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import React, { Dispatch, SetStateAction, useState } from "react";
import { HiOutlineSparkles } from "react-icons/hi";

// Lazy load modals since they're only needed when user configures agent
const APIKeyValidationModal = dynamic(
  () =>
    import("./api-key-validation-modal").then((mod) => ({ default: mod.APIKeyValidationModal })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-white/70 flex items-center justify-center">
        <div className="bg-secondary rounded-lg p-8 flex flex-col items-center border-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

const ModelSelectionModal = dynamic(
  () => import("./model-selection-modal").then((mod) => ({ default: mod.ModelSelectionModal })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-white/70 flex items-center justify-center">
        <div className="bg-secondary rounded-lg p-8 flex flex-col items-center border-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

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

  const areAPIKeysValid = !!(props.apiKeyValidity?.stt && props.apiKeyValidity.llm);

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
        onTapStart={() => props.onConnectButtonClicked()}
        className="bg-transparent rounded-full hover:cursor-auto p-2 button-wrapper-touch-optimized"
        tabIndex={-1}
      >
        <motion.button
          whileHover={{
            scale: 1.1,
            transition: { duration: 0.2 },
          }}
          className="control-button flex items-center justify-center rounded-full hover:cursor-pointer hover:bg-secondary/10 touch-manipulation"
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
          onClick={handleOpenModal}
          className="bg-transparent rounded-full button-wrapper-touch-optimized hover:cursor-auto p-2"
        >
          <motion.button
            whileHover={{
              scale: 1.1,
              transition: { duration: 0.2 },
            }}
            className="bg-primary flex items-center justify-center rounded-full control-button shadow-black/10 shadow-sm hover:cursor-pointer touch-manipulation"
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
