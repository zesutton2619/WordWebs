// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react";

const SpiderWebLoader = ({ size = 64, className = "" }) => {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <span className="text-4xl">🕸️</span>
    </motion.div>
  );
};

export default SpiderWebLoader;