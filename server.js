import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Buffer } from "buffer";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'mensal')));
// Endpoint que gera o PIX
app.post("/api/pix", async (req, res) => {
  try {
    const API_KEY = process.env.BUCKPAY_API_KEY;
    const COMPANY_ID = process.env.BUCKPAY_COMPANY_ID;

    // Garante que as chaves de API estão definidas
    if (!API_KEY || !COMPANY_ID) {
      return res.status(500).json({ error: "API_KEY or COMPANY_ID not configured in .env" });
    }

    const authString = Buffer.from(`${API_KEY}:`).toString("base64");

    const payload = {
      amount: "10.00",
      orderId: `my-order-id-${Date.now()}`,
      description: "Pagamento do Produto",
      expirationInMinutes: 10,
      companyId: COMPANY_ID
    };

    const response = await fetch("https://api.buckpay.com/v1/qrcode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    console.error("Erro ao processar pagamento:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));