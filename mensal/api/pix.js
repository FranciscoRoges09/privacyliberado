import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Buffer } from "buffer";

dotenv.config();
const app = express();
app.use(express.json());

// Endpoint que gera PIX
app.post("/api/pix", async (req, res) => {
  try {
    const API_KEY = process.env.BUCKPAY_API_KEY;
    const COMPANY_ID = process.env.BUCKPAY_COMPANY_ID;

    const authString = Buffer.from(`${API_KEY}:`).toString("base64");

    const payload = {
      amount: "10.00",
      orderId: "my-order-id-001",
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
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
