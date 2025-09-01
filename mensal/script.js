async function fetchPixCode() {
  document.getElementById("pix-section").style.display = 'none';
  document.getElementById("loading-section").style.display = 'block';

  try {
    const res = await fetch("/api/pix", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      document.getElementById("loading-text").innerText = "Erro ao gerar o PIX.";
      console.error("API Error:", data.error);
      return;
    }

    document.getElementById("qrcode-img").src = data.qrCodeImage;
    document.getElementById("pix-code").value = data.qrCodeString;
    document.getElementById("VALOR_PAGAMENTO").innerText = `R$ ${data.amount}`;

    const expirationDate = new Date(data.expiration);
    const formattedDate = expirationDate.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    document.getElementById("expiration").innerText = formattedDate;

    document.getElementById("loading-section").style.display = 'none';
    document.getElementById("pix-section").style.display = 'block';
  } catch (error) {
    document.getElementById("loading-text").innerText = "Falha ao processar pagamento.";
    console.error("Fetch Error:", error);
  }
}

window.addEventListener("load", fetchPixCode);

const copyBtn = document.getElementById("copy-btn");
const pixCodeInput = document.getElementById("pix-code");

copyBtn.addEventListener("click", () => {
  pixCodeInput.select();
  document.execCommand("copy");
  
  copyBtn.innerText = "Copiado!";
  copyBtn.classList.add("copied");

  setTimeout(() => {
    copyBtn.innerText = "Copiar";
    copyBtn.classList.remove("copied");
  }, 2000);
});