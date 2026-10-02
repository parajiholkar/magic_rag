import express from "express";
import router from "./router/index.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.raw({ type: "application/pdf", limit: "50mb" }));

app.get("/", (req, res) => {
  res.status(200).json({ status: 200, message: "Welcome to my API!" });
});

app.use("/api", router);

export default app;