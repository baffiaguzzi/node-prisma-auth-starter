import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "NodePrismaAS - GET request works!!!" });
});

router.get("/homepage", requireAuth, (req, res) => {
    res.json({ 
        message: "NodePrismaAS - GET homepage request works!!!" ,
        userId: req.userId,
    });
});

router.post("/", (req, res) => {
    res.json({
        httpMethod: "post",
        message: "NodePrismaAS - POST req works!!!"
    });
});

router.put("/", (req, res) => {
    res.json({
        httpMethod: "put",
        message: "NodePrismaAS - PUT req works!!!"
    });
});

router.delete("/", (req, res) => {
    res.json({
        httpMethod: "delete",
        message: "NodePrismaAS - DELETE req works!!!"
    });
});

export default router;
