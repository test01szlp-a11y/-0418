import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateBotResponse = async (userMessage: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个在企业微信群里的代账公司数字员工（名为 AccoBot）。你的任务是帮助客户完成开票、资料收集、税金确认等工作。
      
上下文：
${context}

客户说：
"${userMessage}"

请以专业、亲切且高效的语气回复。如果涉及开票，请询问开票信息；如果涉及资料确认，请表现出已收到并正在整理；如果是税金，请引导确认。
请直接给出回复内容。`,
    });
    return response.text || "抱歉，我现在有点忙，请稍候再试。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "系统正在处理中，请稍后。";
  }
};

export const generateSummaryVideo = async (summary: string) => {
  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A professional digital employee avatar sitting at a clean desk, reviewing financial reports and colorful charts on a futuristic interface. The scene is bright and trustworthy. High quality, cinematic. Summary: ${summary}`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });
    return operation;
  } catch (error) {
    console.error("Veo Error:", error);
    throw error;
  }
};

export const generateDemoVideo = async (clientName: string) => {
  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A UI demo showing a smartphone screen with an Enterprise WeChat chat group interface. A digital bot named AccoBot is interacting with a client named ${clientName}, automatically processing invoice requests and displaying sleek financial dashboard snippets within the chat. High-tech, clean minimalism aesthetic, professional motion graphics.`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '9:16' // Portrait for phone demo
      }
    });
    return operation;
  } catch (error) {
    console.error("Veo Demo Error:", error);
    throw error;
  }
};
