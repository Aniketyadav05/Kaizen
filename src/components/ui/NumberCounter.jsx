import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export default function NumberCounter({ value, isCurrency = true, className = "", prefix = "" }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplayValue(isCurrency ? formatCurrency(latest) : latest.toFixed(0));
    });
  }, [spring, isCurrency]);

  return (
    <motion.span className={className}>
      {prefix}{displayValue}
    </motion.span>
  );
}
