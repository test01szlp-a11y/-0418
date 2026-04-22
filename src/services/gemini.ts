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

请以专业、亲切且高效的语气回复。
业务规则：
1. 如果涉及开票请求，请告知客户：“本月开票额度还剩 5000.00 元”，并紧接着询问详情：“请提供购方名称、开票商品、金额信息”。
2. 如果涉及资料确认，请表现出已收到并正在整理。
3. 如果客户咨询有关“如何少交税”、“如何避税/节税”、“税务筹划”、“如何规避风险”等复杂财务规划问题，请回复：“这是一个非常专业且具体的问题，超出了我的自动化处理范围。为了给您提供最准确、合法的建议，我已经呼叫我们的资深财税专家人工为您处理，请稍候。” 并在回复的结尾严格添加标记 [SIGNAL_MANUAL_INTERVENTION] 。
4. 其他场景，正常提供帮助。

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

export const generateDemoVideo = async (clientName: string, chatHistory: string) => {
  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A dynamic screen recording demo of a mobile business app. It shows an automated chat flow between a client named ${clientName} and a digital assistant. The video shows the chat history: ${chatHistory.substring(0, 500)}. It features sleek animations of invoice generation, document classification, and tax calculation results popping up in a modern, minimal UI. Cinematic lightning, 4k, professional tech demo style.`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '9:16'
      }
    });
    return operation;
  } catch (error) {
    console.error("Veo Demo Error:", error);
    throw error;
  }
};
