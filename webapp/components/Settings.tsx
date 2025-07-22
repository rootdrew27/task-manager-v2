import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { motion } from "framer-motion";
import { useState } from "react";
import { BsGearFill } from "react-icons/bs";
import { SettingsModal } from "./settings-modal";

interface SettingsProps {
  apiKeyValidity: ApiKeyValidity | null;
  setApiKeyValidity: (validity: ApiKeyValidity | null) => void;
  selectedModels: SelectedModels | null;
  setSelectedModels: (models: SelectedModels | null) => void;
}

export function Settings(props: SettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.8 }}
        transition={{ duration: 0.4, delay: 0 }}
        onClick={handleClick}
        className="bg-white rounded-full w-[100px] h-[100px] flex items-center justify-center hover:cursor-pointer"
      >
        <BsGearFill className="text-black h-7 w-7" />
      </motion.button>

      {isModalOpen && (
        <SettingsModal
          onClose={handleCloseModal}
          apiKeyValidity={props.apiKeyValidity}
          setApiKeyValidity={props.setApiKeyValidity}
          selectedModels={props.selectedModels}
          setSelectedModels={props.setSelectedModels}
        />
      )}
    </>
  );
}
