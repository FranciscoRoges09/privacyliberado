// Acessa o token da Buckpay do arquivo .env
const BUCKPAY_TOKEN = process.env.BUCKEPAY_TOKEN;

// Configurações de Alta Conversão
const VALOR_PAGAMENTO = 990; // em centavos
const UPSELL_URL = 'https://upsell.chatdescobrindosegredos.com/';

// Elementos de Conversão
const loadingSection = document.getElementById('loading-section');
const pixSection = document.getElementById('pix-section');
const qrCodeImg = document.getElementById('qrcode-img');
const pixCodeInput = document.getElementById('pix-code');
const copyBtn = document.getElementById('copy-btn');
const valorElement = document.getElementById('VALOR_PAGAMENTO');
const expirationElement = document.getElementById('expiration');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');

let externalId; // Variável para armazenar o ID externo da transação

// Gerar Dados do Cliente para Conversão
function generateClientData() {
  const urlParams = new URLSearchParams(window.location.search);
  const nomeParam = urlParams.get('nome');
  const emailParam = urlParams.get('email');
  const cpfParam = urlParams.get('cpf');
  const phoneParam = urlParams.get('phone');

  const nomes = ['Lucas', 'João', 'Mariana', 'Bruna', 'Carlos', 'Ana'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza'];

  const nome = nomeParam || `${nomes[Math.floor(Math.random() * nomes.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
  const email = emailParam || `${nome.toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}@gmail.com`;
  const cpf = cpfParam || generateCPF();
  const telefone = phoneParam || `55119${Math.floor(10000000 + Math.random() * 90000000)}`;

  return { nome, email, cpf, telefone, utm: Object.fromEntries(urlParams.entries()) };
}

// Gerar CPF Válido (para conversão)
function generateCPF() {
  let cpf = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  
  const calcDV = (partial, factor) => {
    let sum = 0;
    for (let i = 0; i < partial.length; i++) {
      sum += parseInt(partial.charAt(i)) * (factor - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? '0' : (11 - remainder).toString();
  };
  
  cpf += calcDV(cpf, 10);
  cpf += calcDV(cpf, 11);
  
  return cpf;
}

// Contador Regressivo de Urgência
function startCountdown() {
  let seconds = 300;
  const update = () => {
    if (seconds <= 0) {
      minutesElement.textContent = '00';
      secondsElement.textContent = '00';
      document.querySelector('.urgency-countdown').style.background = 'linear-gradient(135deg, #616161, #9E9E9E)';
      document.querySelector('.countdown-header').innerHTML = '<i class="fas fa-exclamation-triangle"></i> TEMPO ESGOTADO!';
      return;
    }
    seconds--;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    minutesElement.textContent = mins;
    secondsElement.textContent = secs;
    if (seconds <= 30) {
      document.querySelector('.urgency-countdown').style.animation = 'pulse 1s infinite';
    }
  };
  update();
  return setInterval(update, 1000);
}

// Verificar Status com Buckpay API
async function checkPaymentStatus(id) {
  try {
   const response = await fetch('https://api.realtechdev.com.br/v1/transactions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${BUCKEPAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Adicione esta linha:
        'User-Agent': 'Buckpay API' 
    },
    body: JSON.stringify(transactionRequest),
    signal: AbortSignal.timeout(8000)
    });
    
    if (!res.ok) throw new Error('Erro na verificação');
    
    const data = await res.json();
    return data.data.status === 'paid';
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return false;
  }
}

// Configurar Botão de Cópia para Máxima Conversão
function setupCopyButton() {
  copyBtn.addEventListener('click', () => {
    pixCodeInput.select();
    document.execCommand('copy');
    
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    copyBtn.classList.add('copied');
    
    const checkIcon = copyBtn.querySelector('i');
    checkIcon.style.animation = 'bounce 0.5s';
    
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="far fa-copy"></i> Copiar';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
}

// Inicialização da Máquina de Conversão
document.addEventListener('DOMContentLoaded', async () => {
  setupCopyButton();
  const clientData = generateClientData();
  valorElement.textContent = (VALOR_PAGAMENTO / 100).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });

  try {
    const transactionRequest = {
      external_id: 'teste_' + Date.now(),
      payment_method: "pix",
      amount: VALOR_PAGAMENTO,
      buyer: {
        name: clientData.nome,
        email: clientData.email,
        document: clientData.cpf,
        phone: clientData.telefone
      },
      product: {
        id: "1",
        name: "Oferta Especial"
      },
      tracking: clientData.utm
    };

    const response = await fetch('https://api.realtechdev.com.br/v1/transactions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${BUCKEPAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(transactionRequest),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Buckpay:', errorText);
      throw new Error(errorText);
    }
    
    const transactionData = await response.json();
    
    if (!transactionData.data || !transactionData.data.pix) {
      throw new Error('Erro ao gerar PIX: resposta inválida da API');
    }
    
    // Armazenar o external_id para a verificação de status
    externalId = transactionData.data.external_id || transactionRequest.external_id;

    qrCodeImg.src = `data:image/png;base64,${transactionData.data.pix.qrcode_base64}`;
    pixCodeInput.value = transactionData.data.pix.code;

    const expiration = new Date(Date.now() + 30 * 60 * 1000);
    expirationElement.textContent = expiration.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    loadingSection.style.display = 'none';
    pixSection.style.display = 'block';

    const countdownInterval = startCountdown();

    const statusInterval = setInterval(async () => {
      if (!externalId) {
        clearInterval(statusInterval);
        return;
      }
      const isPaid = await checkPaymentStatus(externalId);
      if (isPaid) {
        clearInterval(countdownInterval);
        clearInterval(statusInterval);
        
        const upsellUrl = new URL(UPSELL_URL);
        const urlParams = new URLSearchParams(window.location.search);
        
        urlParams.forEach((value, key) => {
          upsellUrl.searchParams.set(key, value);
        });
        
        upsellUrl.searchParams.set('payment_id', externalId);
        upsellUrl.searchParams.set('payment_method', 'pix');
        upsellUrl.searchParams.set('payment_value', VALOR_PAGAMENTO);
        
        setTimeout(() => {
          window.location.href = upsellUrl.toString();
        }, 800);
      }
    }, 3000);

    setTimeout(() => clearInterval(statusInterval), 30 * 60 * 1000);

  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    loadingSection.innerHTML = `
      <div style="color: var(--error); margin-bottom: 20px;">
        <i class="fas fa-exclamation-triangle"></i> Erro ao processar pagamento: ${error.message}
      </div>
      <button onclick="window.location.reload()" 
        style="background: var(--primary); color: white; border: none; padding: 12px 24px; 
        border-radius: 8px; cursor: pointer; font-weight: 500;">
        Tentar Novamente
      </button>
    `;
  }
});