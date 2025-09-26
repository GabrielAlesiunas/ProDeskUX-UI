// Dados persistidos
let users = JSON.parse(localStorage.getItem("users")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
let currentUser = null;
let selectedSpace = null;
let reviewRating = 0;

const spaces = [
  {name:'Coworking Central', price:50, description:'Espaço amplo e moderno', address:'Rua A, 123', image:'assets/imagem2.jpg'},
  {name:'Espaço Startup', price:70, description:'Ambiente ideal para startups', address:'Rua B, 456', image:'assets/imagem1.jpg'},
  {name:'Sala Executiva', price:100, description:'Sala para reuniões executivas', address:'Av. C, 789', image:'assets/imagem3.jpg'}
];

// Helper: show accessible status message instead of alert()
function showStatus(message, focusSelector=null) {
  const status = document.getElementById('status');
  status.textContent = message;
  // optionally move focus to main for screen readers when important:
  if (focusSelector) {
    const el = document.querySelector(focusSelector);
    if (el) el.focus();
  }
  // Keep message for a short while
  setTimeout(()=> { if (status.textContent === message) status.textContent = ''; }, 6000);
}

// Simple inline validator helper
function setFieldError(id, message){
  const el = document.getElementById(id);
  const err = document.getElementById(id + '-error');
  if(el) el.setAttribute('aria-invalid', 'true');
  if(err) err.textContent = message;
}
function clearFieldError(id){
  const el = document.getElementById(id);
  const err = document.getElementById(id + '-error');
  if(el) el.removeAttribute('aria-invalid');
  if(err) err.textContent = '';
}

// Navegação entre telas
function showRegister() {
  document.getElementById('loginScreen').classList.add('d-none');
  document.getElementById('registerScreen').classList.remove('d-none');
  document.getElementById('registerName').focus();
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('d-none');
  document.getElementById('registerScreen').classList.add('d-none');
  document.getElementById('loginEmail').focus();
}

function validateRegisterFields(name,email,password){
  let ok = true;
  clearFieldError('registerName'); clearFieldError('registerEmail'); clearFieldError('registerPassword');
  if(!name || name.trim().length < 2){ setFieldError('registerName','Informe um nome válido'); ok = false; }
  if(!email || !/^\S+@\S+\.\S+$/.test(email)){ setFieldError('registerEmail','E-mail inválido'); ok = false; }
  if(!password || password.length < 6){ setFieldError('registerPassword','Senha deve ter ao menos 6 caracteres'); ok = false; }
  return ok;
}

function register(){
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  if(!validateRegisterFields(name,email,password)){
    showStatus('Corrija os campos destacados.');
    return;
  }

  if(users.find(u => u.email === email)){
    setFieldError('registerEmail','E-mail já cadastrado');
    showStatus('E-mail já cadastrado.');
    return;
  }
  users.push({name,email,password});
  localStorage.setItem("users", JSON.stringify(users));
  showStatus('Cadastro realizado com sucesso!', '#loginEmail');
  showLogin();
}

function login() {
  clearFieldError('loginEmail'); clearFieldError('loginPassword');
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if(!email || !password){ 
    if(!email) setFieldError('loginEmail','Informe o e-mail');
    if(!password) setFieldError('loginPassword','Informe a senha');
    showStatus('Preencha e-mail e senha.');
    return;
  }
  const user = users.find(u => u.email === email && u.password === password);
  if(user){
    currentUser = user;
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('mainScreen').classList.remove('d-none');
    document.getElementById('logoutBtn').classList.remove('d-none');
    loadCards();
    showStatus(`Bem-vindo(a), ${currentUser.name}!`);
  } else {
    setFieldError('loginEmail','E-mail ou senha incorretos');
    showStatus('E-mail ou senha incorretos.');
  }
}

function logout(){
  currentUser = null;
  document.getElementById('mainScreen').classList.add('d-none');
  document.getElementById('loginScreen').classList.remove('d-none');
  document.getElementById('logoutBtn').classList.add('d-none');
  document.getElementById('loginEmail').focus();
  showStatus('Sessão encerrada.');
}

// Listagem dos espaços
function loadCards() {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = '';

  let filteredSpaces = [...spaces];
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  if(searchValue){
    filteredSpaces = filteredSpaces.filter(s => s.name.toLowerCase().includes(searchValue) || s.description.toLowerCase().includes(searchValue));
  }

  const sortValue = document.getElementById('sortSelect').value;
  if(sortValue === "priceAsc") filteredSpaces.sort((a,b)=>a.price-b.price);
  if(sortValue === "priceDesc") filteredSpaces.sort((a,b)=>b.price-a.price);

  filteredSpaces.forEach((space, index)=>{
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    // ensure alt text includes short desc
    const altText = `${space.name} — ${space.description}`;
    card.innerHTML = `
      <article class="card h-100 shadow-sm" aria-labelledby="title-${index}">
        <img src="${space.image}" class="card-img-top" alt="${altText}">
        <div class="card-body">
          <h3 id="title-${index}" class="h5 card-title">${space.name}</h3>
          <p class="card-text">${space.description}</p>
          <p><strong>Endereço:</strong> ${space.address}</p>
          <p><strong>Preço:</strong> R$ ${space.price}</p>
          <button class="btn btn-success w-100 rent-btn" type="button" data-index="${index}">Alugar</button>
        </div>
        <div class="card-footer">
          <h6>Avaliações:</h6>
          <div>${renderReviews(space.name)}</div>
        </div>
      </article>
    `;
    container.appendChild(card);
  });

  // Attach handlers to rent buttons (keyboard accessible)
  document.querySelectorAll('.rent-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openPaymentModal(parseInt(e.currentTarget.dataset.index,10)));
  });

  // move focus to container when results load
  container.focus();
}

// Renderizar avaliações
function renderReviews(spaceName){
  const spaceReviews = reviews[spaceName] || [];
  if(spaceReviews.length === 0) return "<em>Sem avaliações ainda</em>";
  return spaceReviews.map(r => `<p>⭐${r.rating} - ${escapeHtml(r.comment)}</p>`).join("");
}

// Escape básico para comentários
function escapeHtml(text){
  if(!text) return '';
  return text.replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
}

// Modal de pagamento
function openPaymentModal(index){
  selectedSpace = spaces[index];
  document.getElementById('spaceInfo').textContent = `Espaço: ${selectedSpace.name} - R$${selectedSpace.price}`;
  togglePaymentFields();
  const modalEl = document.getElementById('paymentModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  // focus first input shortly after show
  setTimeout(()=> {
    const first = modalEl.querySelector('#paymentMethod');
    first && first.focus();
  }, 200);
}

function togglePaymentFields(){
  const method = document.getElementById('paymentMethod').value;
  const cardFields = document.getElementById('cardFields');
  const pix = document.getElementById('pixFields');
  const boleto = document.getElementById('boletoFields');

  if(method === 'credit' || method === 'debit'){
    cardFields.classList.remove('d-none');
    pix.classList.add('d-none'); pix.setAttribute('aria-hidden','true');
    boleto.classList.add('d-none'); boleto.setAttribute('aria-hidden','true');
  } else if(method === 'pix'){
    cardFields.classList.add('d-none');
    pix.classList.remove('d-none'); pix.removeAttribute('aria-hidden');
    boleto.classList.add('d-none'); boleto.setAttribute('aria-hidden','true');
  } else if(method === 'boleto'){
    cardFields.classList.add('d-none');
    pix.classList.add('d-none'); pix.setAttribute('aria-hidden','true');
    boleto.classList.remove('d-none'); boleto.removeAttribute('aria-hidden');
  } else {
    cardFields.classList.add('d-none');
    pix.classList.add('d-none'); boleto.classList.add('d-none');
  }
}

// Validate payment fields, show inline errors
function confirmPayment(){
  clearFieldError('cardNumber'); clearFieldError('cardName'); clearFieldError('cardExpiry'); clearFieldError('cardCVV');
  const method = document.getElementById('paymentMethod').value;
  if((method==='credit'||method==='debit')){
    const num = (document.getElementById('cardNumber').value || '').replace(/\s+/g,'');
    const name = document.getElementById('cardName').value || '';
    const exp = document.getElementById('cardExpiry').value || '';
    const cvv = document.getElementById('cardCVV').value || '';

    let ok = true;
    if(!/^\d{13,19}$/.test(num)){ setFieldError('cardNumber','Número do cartão inválido'); ok = false; }
    if(name.trim().length < 2){ setFieldError('cardName','Nome inválido'); ok = false; }
    if(!/^\d{2}\/\d{2}$/.test(exp)){ setFieldError('cardExpiry','Formato MM/AA'); ok = false; }
    if(!/^\d{3,4}$/.test(cvv)){ setFieldError('cardCVV','CVV inválido'); ok = false; }
    if(!ok){ showStatus('Corrija os campos do cartão.'); return; }
  }

  // Success
  showStatus(`Pagamento via ${method.toUpperCase()} realizado com sucesso!`);
  bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
  openReviewModal();
}

// Modal de avaliação
function openReviewModal(){
  document.getElementById('reviewSpaceInfo').textContent = `Avalie o espaço: ${selectedSpace.name}`;
  const modalEl = document.getElementById('reviewModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  setTimeout(()=> {
    document.getElementById('starGroup').querySelector('.star').focus();
  }, 200);
}

// Stars keyboard & click
document.addEventListener('click', (e) => {
  if(e.target && e.target.classList.contains('star')){
    const v = parseInt(e.target.dataset.value,10);
    setRating(v);
  }
});
document.addEventListener('keydown', (e) => {
  if(e.target && e.target.classList && e.target.classList.contains('star')){
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      e.target.click();
    }
    // Left/Right to move rating
    if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
      e.preventDefault();
      const current = document.querySelectorAll('.star');
      let idx = Array.from(current).indexOf(e.target);
      if(e.key === 'ArrowRight' && idx < current.length -1) current[idx+1].focus();
      if(e.key === 'ArrowLeft' && idx > 0) current[idx-1].focus();
    }
  }
});

function setRating(val){
  reviewRating = val;
  document.querySelectorAll('.star').forEach(s => {
    const v = parseInt(s.dataset.value,10);
    s.textContent = v <= val ? '★' : '☆';
    s.setAttribute('aria-pressed', v <= val ? 'true' : 'false');
  });
  // set status for screen readers
  showStatus(`Avaliação selecionada: ${val} estrela${val>1 ? 's' : ''}`);
}

function submitReview(){
  clearFieldError('reviewComment');
  const comment = document.getElementById('reviewComment').value.trim();
  if(reviewRating === 0){ setFieldError('reviewComment','Selecione a nota'); showStatus('Selecione a nota'); return; }
  if(comment.length > 500){ setFieldError('reviewComment','Comentário muito longo'); showStatus('Comentário muito longo'); return; }

  if(!reviews[selectedSpace.name]) reviews[selectedSpace.name] = [];
  reviews[selectedSpace.name].push({rating: reviewRating, comment});
  localStorage.setItem("reviews", JSON.stringify(reviews));
  showStatus("Avaliação enviada!");
  bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
  loadCards();
  reviewRating = 0;
  document.getElementById('reviewComment').value = '';
}

// initialize stars with tabindex
function initStars(){
  document.querySelectorAll('.star').forEach(s => {
    s.setAttribute('tabindex','0');
  });
}

// On load
document.addEventListener('DOMContentLoaded', () => {
  initStars();
  // if user already logged, show main
  if(currentUser){ document.getElementById('loginScreen').classList.add('d-none'); document.getElementById('mainScreen').classList.remove('d-none'); loadCards(); }
});
