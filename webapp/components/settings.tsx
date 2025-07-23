import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { motion } from "motion/react";
import { useState } from "react";
import { GoGear } from "react-icons/go";
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
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="bg-white rounded-full w-[50px] h-[50px] flex items-center justify-center hover:cursor-pointer hover:bg-gray-50"
      >
        <motion.span
          className="inline-block"
          whileHover={{ rotate: 180 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <GoGear className="text-gray-600 h-6 w-6" strokeWidth={0.3} />
        </motion.span>
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
