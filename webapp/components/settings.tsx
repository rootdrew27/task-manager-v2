import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { GoGear } from "react-icons/go";

// Lazy load the settings modal since it's only needed when clicked
const SettingsModal = dynamic(
  () => import("./settings-modal").then((mod) => ({ default: mod.SettingsModal })),
  {
    loading: () => <div className="" />,
    ssr: false,
  }
);

interface SettingsProps {
  apiKeyValidity: ApiKeyValidity | null;
  setApiKeyValidity: (validity: ApiKeyValidity | null) => void;
  selectedModels: SelectedModels | null;
  setSelectedModels: (models: SelectedModels | null) => void;
}

export function Settings(props: SettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    await new Promise(() =>
      setTimeout(() => {
        setIsModalOpen(true);
      }, 600)
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <motion.div
        whileTap={{
          scale: 0.8,
          transition: { duration: 0.1, ease: "easeOut" },
        }}
        onTapStart={() => handleClick()}
        className="bg-transparent rounded-full p-2 button-wrapper-touch-optimized"
        tabIndex={-1}
      >
        <motion.button
          whileHover={{
            scale: 1.1,
            transition: { duration: 0.2 },
          }}
          className="bg-white rounded-full control-button flex items-center justify-center hover:cursor-pointer shadow-black/10 shadow-sm touch-manipulation"
        >
          <motion.span whileHover={{ rotate: 180 }}>
            <GoGear className="text-oxford-blue h-6 w-6" strokeWidth={0.3} />
          </motion.span>
        </motion.button>
      </motion.div>

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
