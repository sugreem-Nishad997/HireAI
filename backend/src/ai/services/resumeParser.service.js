import groq from "../config/groq.js";
import { resumeParserPrompt } from "../prompts/resumeParser.prompt.js";

export const parseResumeWithAI = async (resumeText) => {
  if (!resumeText?.trim()) {
    throw new Error("Resume text is empty.");
  }

  if (resumeText.length > 60000) {
    throw new Error("Resume text is too long.");
  }

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

    messages: [
      {
        role: "system",
        content: resumeParserPrompt,
      },
      {
        role: "user",
        content: `Parse the following resume text:\n\n${resumeText}`,
      },
    ],

    response_format: { type: "json_object" },
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned an empty response.");
  }

  return JSON.parse(content);
};
