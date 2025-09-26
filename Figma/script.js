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

// Navegação
function showRegister() {
  document.getElementById('loginScreen').classList.add('d-none');
  document.getElementById('registerScreen').classList.remove('d-none');
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('d-none');
  document.getElementById('registerScreen').classList.add('d-none');
}

function register() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  if(name && email && password){
    if(users.find(u => u.email === email)){
      alert("E-mail já cadastrado!");
      return;
    }
    users.push({name,email,password});
    localStorage.setItem("users", JSON.stringify(users));
    alert('Cadastro realizado com sucesso!');
    showLogin();
  } else {
    alert('Preencha todos os campos');
  }
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const user = users.find(u => u.email === email && u.password === password);
  if(user){
    currentUser = user;
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('mainScreen').classList.remove('d-none');
    document.getElementById('logoutBtn').classList.remove('d-none');
    loadCards();
  } else {
    alert('E-mail ou senha incorretos');
  }
}

function logout(){
  currentUser = null;
  document.getElementById('mainScreen').classList.add('d-none');
  document.getElementById('loginScreen').classList.remove('d-none');
  document.getElementById('logoutBtn').classList.add('d-none');
}

// Listagem dos espaços
function loadCards() {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = '';

  let filteredSpaces = [...spaces];
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  if(searchValue){
    filteredSpaces = filteredSpaces.filter(s => s.name.toLowerCase().includes(searchValue));
  }

  const sortValue = document.getElementById('sortSelect').value;
  if(sortValue === "priceAsc") filteredSpaces.sort((a,b)=>a.price-b.price);
  if(sortValue === "priceDesc") filteredSpaces.sort((a,b)=>b.price-a.price);

  filteredSpaces.forEach(space=>{
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    card.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${space.image}" class="card-img-top" alt="${space.name}">
        <div class="card-body">
          <h5 class="card-title">${space.name}</h5>
          <p class="card-text">${space.description}</p>
          <p><strong>Endereço:</strong> ${space.address}</p>
          <p><strong>Preço:</strong> R$ ${space.price}</p>
          <button class="btn btn-success w-100" onclick="openPaymentModal(${spaces.indexOf(space)})">Alugar</button>
        </div>
        <div class="card-footer">
          <h6>Avaliações:</h6>
          <div>${renderReviews(space.name)}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Renderizar avaliações
function renderReviews(spaceName){
  const spaceReviews = reviews[spaceName] || [];
  if(spaceReviews.length === 0) return "<em>Sem avaliações ainda</em>";
  return spaceReviews.map(r => `<p>⭐${r.rating} - ${r.comment}</p>`).join("");
}

// Modal de pagamento
function openPaymentModal(index){
  selectedSpace = spaces[index];
  document.getElementById('spaceInfo').textContent = `Espaço: ${selectedSpace.name} - R$${selectedSpace.price}`;
  new bootstrap.Modal(document.getElementById('paymentModal')).show();
  togglePaymentFields();
}

function togglePaymentFields(){
  const method = document.getElementById('paymentMethod').value;
  document.getElementById('cardFields').style.display = (method==='credit' || method==='debit') ? 'block' : 'none';
  document.getElementById('pixFields').classList.toggle('d-none', method!=='pix');
  document.getElementById('boletoFields').classList.toggle('d-none', method!=='boleto');
}

function confirmPayment(){
  const method = document.getElementById('paymentMethod').value;
  if((method==='credit'||method==='debit') && 
     (!document.getElementById('cardNumber').value || !document.getElementById('cardName').value || !document.getElementById('cardExpiry').value || !document.getElementById('cardCVV').value)){
    alert('Preencha todos os campos do cartão');
    return;
  }
  alert(`Pagamento via ${method.toUpperCase()} realizado com sucesso!`);
  bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
  openReviewModal();
}

// Modal de avaliação
function openReviewModal(){
  document.getElementById('reviewSpaceInfo').textContent = `Avalie o espaço: ${selectedSpace.name}`;
  new bootstrap.Modal(document.getElementById('reviewModal')).show();
}

function rateReview(star){
  const stars = star.parentNode.querySelectorAll('.stars');
  let index = Array.from(stars).indexOf(star);
  reviewRating = index+1;
  stars.forEach((s,i)=> s.textContent=i<=index?'★':'☆');
}

function submitReview(){
  const comment = document.getElementById('reviewComment').value;
  if(reviewRating===0){ alert('Selecione a nota'); return;}
  if(!reviews[selectedSpace.name]) reviews[selectedSpace.name] = [];
  reviews[selectedSpace.name].push({rating: reviewRating, comment});
  localStorage.setItem("reviews", JSON.stringify(reviews));
  alert("Avaliação enviada!");
  bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
  loadCards();
  reviewRating = 0;
  document.getElementById('reviewComment').value = '';
}
