import React from "react";
import { Typography, Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

interface SuccessModalContentProps {
    onClose: () => void;
}

export const SuccessModalContent: React.FC<SuccessModalContentProps> = ({ onClose }) => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                textAlign: "center",
                fontFamily: "'Inter', sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background Decor (Optional subtle particles or gradient) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 300,
                    height: 300,
                    background: "radial-gradient(circle, rgba(82,196,26,0.1) 0%, rgba(255,255,255,0) 70%)",
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* Outer Halo Ring - Animated */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: 0.1
                }}
                style={{
                    width: 100,
                    height: 100,
                    backgroundColor: "#f6ffed",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 25,
                    zIndex: 1,
                    boxShadow: "0 0 0 8px rgba(82, 196, 26, 0.06)", // Third ring effect
                }}
            >
                {/* Inner Solid Circle - Animated */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        delay: 0.2
                    }}
                    style={{
                        width: 64,
                        height: 64,
                        backgroundColor: "#52c41a",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 20px rgba(82, 196, 26, 0.4)",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, pathLength: 0 }}
                        animate={{ opacity: 1, scale: 1, pathLength: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        <CheckOutlined style={{ fontSize: 34, color: "white", fontWeight: "bold" }} />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Text Animation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{ zIndex: 1 }}
            >
                <Typography.Title level={3} style={{ margin: 0, marginBottom: 8, fontWeight: 800, color: "#2F3136" }}>
                    Update Complete!
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 16, marginBottom: 32, display: "block", maxWidth: 280, margin: "0 auto 32px" }}>
                    Your profile has been updated successfully.
                </Typography.Text>
            </motion.div>

            {/* Button Animation */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ zIndex: 1 }}
            >
                <Button
                    type="primary"
                    size="large"
                    style={{
                        background: "linear-gradient(135deg, #73d13d 0%, #52c41a 100%)",
                        borderColor: "transparent",
                        borderRadius: 40,
                        padding: "0 50px",
                        height: 50,
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                    }}
                    onClick={onClose}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                    }}
                >
                    CONTINUE
                </Button>
            </motion.div>
        </div>
    );
};
