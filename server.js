
const express = require("express");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("."));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/generate", async (req, res) => {
  try {
    const { business, platform, goal, product, audience, tone, details } = req.body;

    const prompt = `
Você é um especialista em marketing digital para pequenos negócios.
Crie exatamente 3 ideias de publicações em português brasileiro.

Tipo de negócio: ${business}
Plataforma: ${platform}
Objetivo: ${goal}
Produto ou serviço: ${product}
Público-alvo: ${audience}
Tom de voz: ${tone}
Detalhes adicionais: ${details || "Nenhum"}

Para cada publicação, inclua:
1. Um título.
2. Uma legenda pronta para publicar.
3. Uma chamada para ação.
4. Hashtags relevantes.

Seja criativo, específico e evite promessas enganosas.
`;

    let response;
let lastError;

for (let attempt = 0; attempt < 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    break;
  } catch (error) {
    lastError = error;

    const message = String(error.message || error);
    const retryable =
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED");

    if (!retryable || attempt === 2) {
      throw error;
    }

    await new Promise(resolve =>
      setTimeout(resolve, 1500 * (2 ** attempt))
    );
  }
}

if (!response) {
  throw lastError || new Error("Não foi possível gerar conteúdo.");
}

res.json({ result: response.text });

    
  } catch (error) {
    console.error("Erro na geração:", error.message);
    res.status(500).json({
      error: "Não foi possível gerar as publicações. Verifique a chave da API e tente novamente.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`MarketingIA rodando em http://localhost:${PORT}`);
});
