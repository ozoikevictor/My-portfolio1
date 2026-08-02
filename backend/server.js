const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing from .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => {
    res.send("✅ Victor's Gemini AI Backend is running!");
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                reply: "No message provided."
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash" // updated: gemini-1.5-flash is shut down
        });

        const prompt = `
You are Victor's AI assistant.

Information about Victor:
- Name: Victor Chibuike Ozoike
- Computer Science student at Caritas University
- Full Stack Developer
- Software Tester
- Builds websites and web applications
- Works with HTML, CSS, JavaScript, Node.js, and AI tools

User question:
${message}
`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.json({
            reply: response
        });

    } catch (error) {
        console.error("Gemini API error:", error.message || error);

        res.status(500).json({
            reply: "AI service error. Please try again shortly."
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});