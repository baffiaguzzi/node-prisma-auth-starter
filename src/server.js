import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB } from "./config/db.js";
import mainRoutes from "./routes/mainRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// CORS: allows requests from the frontend
app.use(
    cors({
        origin: "http://localhost:3000", 
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

app.use(cookieParser());

//Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//API routes
app.use("/main", mainRoutes);
app.use("/auth", authRoutes);

const startServer = async () => {
    await connectDB();

    const PORT = 5001;
    const server = app.listen(PORT, () => {
        console.log(`SERVER running on ${PORT}`);
    });

    process.on("unhandledRejection", (err) => {
        console.error("Unhandled Rejection:", err);
        server.close(async () => {
            await disconnectDB();
            process.exit(1);
        });
    });

    process.on("uncaughtException", async (err) => {
        console.error("Uncaught Exception:", err);
        await disconnectDB();
        process.exit(1);
    });

    process.on("SIGTERM", async () => {
        console.log("SIGTERM received, shutting down gracefully");
        server.close(async () => {
            await disconnectDB();
            process.exit(0);
        });
    });
};

startServer();
