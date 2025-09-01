async function fetchPixCode() {
  document.getElementById("pix-section").style.display = 'none';
  document.getElementById("loading-section").style.display = 'block';

  try {
    // pede para o servidor gerar o Pix
    const res = await fetch("/api/pix", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      document.getElementById("loading-text").innerText = "Erro ao gerar o PIX.";
      return;
    }

    // Atualiza o HTML com o QR Code
    document.getElementById("qrcode-img").src = data.qrCodeImage;
    document.getElementById("pix-code").value = data.qrCodeString;

    document.getElementById("loading-section").style.display = 'none';
    document.getElementById("pix-section").style.display = 'block';
  } catch (error) {
    document.getElementById("loading-text").innerText = "Falha ao processar pagamento.";
  }
}

window.addEventListener("load", fetchPixCode);
