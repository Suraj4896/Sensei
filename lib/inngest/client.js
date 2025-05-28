import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "sensei2", name: "Sensei2",
    credentials: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY,
        },
    },
 });
