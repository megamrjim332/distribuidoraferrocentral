async function guardarPedidoEnServidor(empresaId, total, notas, items) {
  const resp = await fetch("/api/pedido", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      empresa_id: empresaId,
      total: total,
      notas: notas,
      items: items
    })
  });

  return await resp.json();
}

// =================== CONFIG / NORMALIZACIÓN ===================
let activeBrand = ""; // "" = todos

// Aseguramos que PRODUCTS exista
if (!Array.isArray(window.PRODUCTS)) {
  window.PRODUCTS = [];
}

// Normalizar todos los productos
PRODUCTS.forEach((p, idx) => {
  // ID interno numérico
  p.id = Number(p.id) || (idx + 1);

  // Marca en minúsculas
  if (p.brand) p.brand = String(p.brand).toLowerCase();

    // ⭐ Estrellas (0–3) desde DISC.ESTRE / estrella_score
  if (typeof p.estrella_score !== "number") {
    p.estrella_score = Number(p.estrella_score) || 0;
  }


  // Precio web: si ya viene, lo respetamos; si no, lo calculamos desde bs_price_descuento25
  if (typeof p.bs_price_web !== "number" || isNaN(p.bs_price_web)) {
    if (typeof p.bs_price_descuento25 === "number" && !isNaN(p.bs_price_descuento25)) {
      const base = p.bs_price_descuento25 / 0.75;  // quitar 25% de descuento
      p.bs_price_web = base * 1.40;                // +40% ganancia
    } else if (typeof p.price === "number") {
      p.bs_price_web = p.price;
    } else {
      p.bs_price_web = 0;
    }
  }

    // ================== CATEGORÍA AUTOMÁTICA ==================
  if (!p.category || !p.category.trim()) {
    const desc  = (p.description || "").toUpperCase();
    const brand = (p.brand || "").toLowerCase();
    let cat = "otros";

    // 1) PRIMERO POR MARCA
    if (brand === "volteck") {
      cat = "material eléctrico";
    } else if (brand === "foset") {
      cat = "plomería y baño";
    } else if (brand === "hermex") {
      cat = "cerrajería";
    } else if (brand === "klintek") {
      cat = "limpieza";
    } else if (brand === "pretul" || brand === "fiero" || brand === "truper") {
      cat = "herramienta manual"; // base genérica
    }

    // Helper: solo cambia si todavía es genérica
    const setCat = (value) => {
      if (
        cat === "otros" ||
        cat === "herramienta manual" ||
        cat === "material eléctrico" ||
        cat === "plomería y baño" ||
        cat === "limpieza" ||
        cat === "cerrajería"
      ) {
        cat = value;
      }
    };

    // 2) LUEGO REFINAMOS POR PALABRAS CLAVE

    // Material eléctrico / iluminación
    if (
      desc.includes("CABLE") ||
      desc.includes("EXTENSIÓN") || desc.includes("EXTENSION") ||
      desc.includes("FOCO") ||
      desc.includes("LUMINARIA") ||
      desc.includes("REFLECTOR") ||
      desc.includes("LÁMPARA") || desc.includes("LAMPARA") ||
      desc.includes("APAGADOR") ||
      desc.includes("CONTACTO")
    ) {
      setCat("material eléctrico");

    // Plomería y baño
    } else if (
      desc.includes("LLAVE MEZCLADORA") ||
      desc.includes("LLAVE LAVABO") ||
      desc.includes("LLAVE REGADERA") ||
      desc.includes("REGADERA") ||
      desc.includes("DUCHA") ||
      desc.includes("TINACO") ||
      desc.includes("SANITARIO") ||
      desc.includes("LAVABO") ||
      desc.includes("FREGADERO") ||
      desc.includes("TRAMPA") ||
      (desc.includes("TUBO") && desc.includes("AGUA"))
    ) {
      setCat("plomería y baño");

    // Cerrajería / herrajes
    } else if (
      desc.includes("CANDADO") ||
      desc.includes("CERRADURA") ||
      desc.includes("CHAPA") ||
      desc.includes("POMO") ||
      desc.includes("MANIJA") ||
      desc.includes("MANIVELA") ||
      desc.includes("BISAGRA") ||
      desc.includes("CERROJO") ||
      desc.includes("PASADOR")
    ) {
      setCat("cerrajería");

    // Limpieza
    } else if (
      desc.includes("ESCOBA") ||
      desc.includes("TRAPEADOR") ||
      desc.includes("MOPA") ||
      desc.includes("FIBRA ABRASIVA") ||
      (desc.includes("CEPILLO") && desc.includes("LIMPIEZA")) ||
      desc.includes("JALADOR") ||
      desc.includes("LIMPIEZA") ||
      desc.includes("BOTE DE BASURA")
    ) {
      setCat("limpieza");

    // Corte y abrasivos (sierras, arcos, discos, brocas, lijas)
    } else if (
      desc.includes("SIERRA") ||
      desc.includes("ARCO MECÁNICO") || desc.includes("ARCO MECANICO") ||
      desc.includes("ARCO DE SIERRA") ||
      desc.includes("DISCO") ||
      desc.includes("SEGUETA") ||
      desc.includes("LIMA") ||
      desc.includes("LIJA") ||
      desc.includes("BROCA") ||
      desc.includes("FRESA") ||
      desc.includes("HOJA DE SIERRA") ||
      desc.includes("NAVAJA")
    ) {
      setCat("corte y abrasivos");

    // Herramienta manual (pinzas, alicates, llaves, destornilladores, juegos de herramientas)
    } else if (
      desc.includes("MARTILLO") ||
      desc.includes("COMBO") || desc.includes("MAZO") ||
      desc.includes("DESARMADOR") || desc.includes("DESTORNILLADOR") ||
      desc.includes("LLAVE") ||
      desc.includes("DADO") ||
      desc.includes("RATCHET") ||
      desc.includes("PINZA") ||
      desc.includes("ALICATE") ||
      desc.includes("TENAZA") ||
      desc.includes("CORTA TUBO") ||
      desc.includes("REMACHADORA") ||
      desc.includes("PRENSA") ||
      desc.includes("JUEGO DE HERRAMIENTAS")
    ) {
      setCat("herramienta manual");

    // Automotriz
    } else if (
      desc.includes("AUTO ") ||
      desc.includes("AUTOMÓVIL") || desc.includes("AUTOMOVIL") ||
      desc.includes("AUTOMOTRIZ") ||
      desc.includes("CABLES PASA CORRIENTE") ||
      desc.includes("GATO HIDRÁULICO") || desc.includes("GATO HIDRAULICO") ||
      desc.includes("COMPRESOR") ||
      (desc.includes("MANÓMETRO") || desc.includes("MANOMETRO")) && desc.includes("LLANTA")
    ) {
      setCat("automotriz");

    // Jardinería
    } else if (
      desc.includes("JARDÍN") || desc.includes("JARDIN") ||
      desc.includes("PALA") ||
      desc.includes("RASTRILLO") ||
      desc.includes("MANGUERA") ||
      desc.includes("ASPERSOR") ||
      desc.includes("FUMIGADOR") ||
      desc.includes("PODAR") || desc.includes("PODA") ||
      desc.includes("TIJERA PARA PODA") ||
      desc.includes("CORTA CÉSPED") || desc.includes("CORTA CESPED")
    ) {
      setCat("jardinería");

        // Pesca (lo que te gusta 😉)
    } else if (
      desc.includes("PESCA") ||
      desc.includes("CAJA PESCA") ||
      desc.includes("ANZUELO") ||
      desc.includes("HILO DE PESCA") ||
      desc.includes("CPE-") // códigos de cajas de pesca como CPE-16N
    ) {
      setCat("pesca");

    // Ropa: chamarras, ponchos, trajes impermeables, poleras, suéteres
    } else if (
      desc.includes("CHAMARRA") ||
      desc.includes("CHAQUETA") ||
      desc.includes("PONCHO") ||
      desc.includes("IMPERMEABLE") ||
      desc.includes("TRAJE IMPERMEABLE") ||
      desc.includes("OVEROL") ||
      desc.includes("PANTALÓN IMPERMEABLE") || desc.includes("PANTALON IMPERMEABLE") ||
      desc.includes("POLERA") ||
      desc.includes("PLAYERA") ||
      desc.includes("SUETER") || desc.includes("SWEATER") ||
      desc.includes("SUDADERA") ||
      (desc.includes("CHALECO") && !desc.includes("REFLECTANTE")) // chaleco normal ≈ ropa
    ) {
      setCat("ropa");

    // Seguridad industrial
    } else if (
      desc.includes("CASCO") ||
      (desc.includes("GUANTE") && !desc.includes("LATEX") && !desc.includes("LÁTEX")) ||
      desc.includes("GUANTE DIELÉCTRICO") || desc.includes("GUANTE DIELECTRICO") ||
      desc.includes("ARNÉS") || desc.includes("ARNES") ||
      desc.includes("LENTE DE SEGURIDAD") ||
      desc.includes("CARETA") ||
      desc.includes("CHALECO REFLECTANTE") || desc.includes("CHALECO ALTA VISIBILIDAD")
    ) {
      setCat("seguridad industrial");

    // Cajas y organizadores
    } else if (
      desc.includes("CAJA PARA HERRAMIENTA") ||
      desc.includes("CAJA HERRAMIENTAS") ||
      desc.includes("ORGANIZADOR") ||
      desc.includes("ORGANIZADOR PLÁSTICO") || desc.includes("ORGANIZADOR PLASTICO") ||
      desc.includes("MALETÍN") || desc.includes("MALETIN") ||
      desc.includes("BOLSA PORTA HERRAMIENTA")
    ) {
      setCat("cajas y organizadores");
    }


    p.category = cat;
  }





  // Etiqueta de venta / caja
  if (!p.sale_label) {
    if (typeof p.box_qty === "number" && p.box_qty > 0) {
      p.sale_label = `CAJA: ${p.box_qty} unidades`;
    } else if (p.mode_of_sale) {
      p.sale_label = p.mode_of_sale;
    } else {
      p.sale_label = "";
    }
  }

  // Imágenes: si no trae, construimos ruta truper_export/CODIGO/images/CODIGO-1.jpg
  if (!Array.isArray(p.images) || p.images.length === 0) {
    if (p.code) {
      p.images = [`truper_export/${p.code}/images/${p.code}-1.jpg`];
    } else {
      p.images = ["img/placeholder.jpg"];
    }
  }
});

// =================== UTILIDADES ===================
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
const fmt = n => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n);
// Bloquear / restaurar scroll del fondo cuando hay modales abiertos
let scrollYBeforeModal = 0;

function lockBodyScroll() {
  scrollYBeforeModal = window.scrollY || window.pageYOffset || 0;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollYBeforeModal}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollYBeforeModal || 0);
}

async function guardarPedidoEmpresa(cart, total, notas) {
  // ¿Hay empresa logueada?
  let empresaInfo = localStorage.getItem("empresaInfo");
  if (!empresaInfo) return null; // si no hay empresa, no hacemos nada

  empresaInfo = JSON.parse(empresaInfo);

  // Armar items para el backend
  const items = cart.map(i => {
    const p = PRODUCTS.find(p => p.id === i.id);
    if (!p) return null;

    const unitPrice = (typeof p.bs_price_web === "number" && !isNaN(p.bs_price_web))
      ? p.bs_price_web
      : (p.price || 0);

    return {
      id: i.id,
      descripcion: p.description || p.title || "",
      cantidad: i.qty,
      precio_unit: unitPrice
    };
  }).filter(Boolean);

  if (!items.length) return null;

  try {
    const resp = await fetch("/api/pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresa_id: empresaInfo.id,
        total: total,
        notas: notas || "",
        items: items
      })
    });

    const data = await resp.json();
    console.log("Respuesta del backend al guardar pedido:", data);
    return data;
  } catch (err) {
    console.error("Error al guardar pedido en servidor:", err);
    return null;
  }
}

// --- Controles de la barra negra superior (sesión empresa) ---
const promoLoginLink    = document.getElementById("promoLoginLink");
const promoRegisterLink = document.getElementById("promoRegisterLink");
const promoLogoutBtn    = document.getElementById("promoLogoutBtn");

function empresaEstaLogueada() {
  try {
    const raw = localStorage.getItem("empresaInfo");
    if (!raw) return false;
    const emp = JSON.parse(raw);
    return !!(emp && emp.id);
  } catch (e) {
    console.error("No se pudo leer empresaInfo", e);
    return false;
  }
}

function actualizarBarraSesion() {
  const logged = empresaEstaLogueada();

  if (promoLoginLink) {
    promoLoginLink.style.display = logged ? "none" : "inline-block";
  }
  if (promoRegisterLink) {
    promoRegisterLink.style.display = logged ? "none" : "inline-block";
  }
  if (promoLogoutBtn) {
    promoLogoutBtn.style.display = logged ? "inline-block" : "none";
  }
}

// Ejecutar una vez al cargar JS
actualizarBarraSesion();

// Cerrar sesión: limpiar empresa y volver al inicio
if (promoLogoutBtn) {
  promoLogoutBtn.addEventListener("click", () => {
    localStorage.removeItem("empresaInfo");
    // Si quieres también limpiar carrito / perfil, se podría hacer aquí.
    window.location.href = "inicio.html";
  });
}

// =================== NODOS PRINCIPALES ===================
const grid          = $("#grid");
const filterCategory = $("#filterCategory");
const filterSort    = $("#filterSort");
const searchInput   = $("#search");

// Desplazar la vista al inicio del grid
function scrollToGridTop() {
  // Subir hasta el inicio de la página, por encima del header
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

const cartBtn       = $("#cartBtn");
const cartPanel     = $("#cartPanel");
const closeCart     = $("#closeCart");
const cartItems     = $("#cartItems");
const cartTotalEl   = $("#cartTotal");
const cartCount     = $("#cartCount");
const checkoutBtn   = $("#checkoutBtn");
const checkoutModal = $("#checkoutModal");
const checkoutTotal = $("#checkoutTotal");
const qrcodeBox     = $("#qrcode");

const checkoutSubtotal     = $("#checkoutSubtotal");
const checkoutTotalFinal   = $("#checkoutTotalFinal");
const checkoutDiscountRow  = $("#checkoutDiscountRow");
const checkoutDiscountText = $("#checkoutDiscountText");


// Paginación
const prevPageBtn = $("#prevPage");
const nextPageBtn = $("#nextPage");
const pageInfo    = $("#pageInfo");
// Paginación inferior
const prevPageBtnBottom = $("#prevPageBottom");
const nextPageBtnBottom = $("#nextPageBottom");
const pageInfoBottom    = $("#pageInfoBottom");


let currentPage = 1;
const pageSize  = 28;   // 👈 productos por página (ajusta a gusto: 20, 40, 60...)
let lastList    = [];   // aquí guardamos el último resultado filtrado

function updatePager(totalItems){
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  // Superior
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;

  // Inferior
  pageInfoBottom.textContent = `${currentPage} / ${totalPages}`;
  prevPageBtnBottom.disabled = currentPage <= 1;
  nextPageBtnBottom.disabled = currentPage >= totalPages;
}


// Datos de envío
const c_name     = $("#c_name");
const c_lastname = $("#c_lastname");
const c_phone    = $("#c_phone");
const c_city     = $("#c_city");
const c_type     = $("#c_type");
const c_number   = $("#c_number");
const c_address  = $("#c_address");
const c_notes    = $("#c_notes");
const sendWhatsApp = $("#sendWhatsApp");

// Empresa logueada (guardada en localStorage por el login)
function getEmpresaActual() {
  try {
    const raw = localStorage.getItem("empresaInfo");
    if (!raw) return null;
    const emp = JSON.parse(raw);
    if (!emp || !emp.id) return null;
    return emp;
  } catch (e) {
    console.error("No se pudo leer empresaInfo", e);
    return null;
  }
}


// Empresa logueada (si viene del login)
function getEmpresaActual() {
  try {
    const raw = localStorage.getItem("empresaInfo");
    if (!raw) return null;
    const emp = JSON.parse(raw);
    if (!emp || !emp.id) return null;
    return emp;
  } catch (e) {
    console.error("No se pudo leer empresaInfo:", e);
    return null;
  }
}



// Perfil (para recordar los datos del cliente)
function saveProfile() {
  const p = {
    name:      c_name?.value.trim() || "",
    lastname:  c_lastname?.value.trim() || "",
    phone:     c_phone?.value.trim() || "",
    city:      c_city?.value || "",
    type:      c_type?.value || "",
    number:    c_number?.value.trim() || "",
    address:   c_address?.value.trim() || "",
    notes:     c_notes?.value.trim() || "",
    lat:       (typeof currentLatLng !== "undefined" && currentLatLng?.lat) ? currentLatLng.lat : null,
    lng:       (typeof currentLatLng !== "undefined" && currentLatLng?.lng) ? currentLatLng.lng : null,
  };
  localStorage.setItem("profile", JSON.stringify(p));
}

function loadProfile() {
  const p = JSON.parse(localStorage.getItem("profile") || "{}");
  if (p.name)      c_name.value = p.name;
  if (p.lastname)  c_lastname.value = p.lastname;
  if (p.phone)     c_phone.value = p.phone;
  if (p.city)      c_city.value = p.city;
  if (p.type)      c_type.value = p.type;
  if (p.number)    c_number.value = p.number;
  if (p.address)   c_address.value = p.address;
  if (p.notes)     c_notes.value = p.notes;
  if (typeof map !== "undefined" && map && p.lat && p.lng && typeof marker !== "undefined") {
    map.setView([p.lat, p.lng], 15);
    marker.setLatLng([p.lat, p.lng]);
  }
}

// Guardado en vivo
[c_name, c_lastname, c_phone, c_city, c_type, c_number, c_address, c_notes]
  .filter(Boolean)
  .forEach(inp => {
    const ev = (inp.tagName === "SELECT") ? "change" : "input";
    inp.addEventListener(ev, saveProfile);
  });

// =================== CARRITO ===================
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// Limpieza inicial por si hay IDs viejos
cart = cart.filter(i => PRODUCTS.some(p => p.id === i.id));

function syncCart() {
  localStorage.setItem("cart", JSON.stringify(cart));

  // Cantidad en el icono
  cartCount.textContent = cart.reduce((s, i) => s + i.qty, 0);

  let total = 0;

  const itemsHtml = cart.map(i => {
    const p = PRODUCTS.find(p => p.id === i.id);
    if (!p) return "";

    const unitPrice = (typeof p.bs_price_web === "number" && !isNaN(p.bs_price_web))
      ? p.bs_price_web
      : (p.price || 0);

    total += unitPrice * i.qty;

    const name = p.description || p.title || `Producto ${p.code || ""}`;
    const img =
      (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) ||
      (p.code ? `truper_export/${p.code}/images/${p.code}-1.jpg`
              : "img/placeholder.jpg");

    return `
      <div class="item">
        <img src="${img}" alt="${name}" onerror="this.src='img/placeholder.jpg'">
        <div>
          <h4>${name}</h4>
          <div class="qty">
            <button data-action="dec" data-id="${i.id}">−</button>
            <span>${i.qty}</span>
            <button data-action="inc" data-id="${i.id}">+</button>
          </div>
        </div>
        <strong>${fmt(unitPrice * i.qty)}</strong>
      </div>
    `;
  }).join("");

  cartItems.innerHTML = itemsHtml || `<p class="empty">Tu carrito está vacío.</p>`;
  cartTotalEl.textContent = fmt(total);
}

// =================== MODAL DE PRODUCTO ===================
function openProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;

  currentProd = p;
  currentImgIndex = 0;

  const name = p.description || p.title || `Producto ${p.code || ""}`;
  const unitPrice = (typeof p.bs_price_web === "number" && !isNaN(p.bs_price_web))
    ? p.bs_price_web
    : (p.price || 0);

  const descParts = [];
  if (p.description) descParts.push(p.description);
  if (p.sale_label) descParts.push(p.sale_label);
  if (p.mode_of_sale && !descParts.includes(p.mode_of_sale)) descParts.push(p.mode_of_sale);

  pdTitle.textContent = name;
  pdPrice.textContent = fmt(unitPrice);
  pdDesc.textContent  = descParts.join("\n");

  // ----- TEXTO DE FICHA TÉCNICA (JSON) -----
  if (pdSpecs) {
    pdSpecs.innerHTML = "";   // limpiar

    if (p.code) {
      const fichaTxtUrl = `truper_export/${p.code}/ficha_texto.json`;

      fetch(fichaTxtUrl)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.texto) return;

          const lineas = Array.isArray(data.texto)
            ? data.texto
            : String(data.texto).split(/\r?\n/);

          pdSpecs.innerHTML = lineas
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .map(l => `<p>${l}</p>`)
            .join("");
        })
        .catch(() => {
          // si no hay archivo o da error, no mostramos nada y listo
        });
    }
  }

  // ===== FICHA TÉCNICA (PDF) =====
  if (pdDatasheetRow && pdDatasheet) {
    // por defecto oculto (igual está con display:none !important en el HTML)
    pdDatasheetRow.style.display = "none";
    pdDatasheet.onclick = null;

    if (p.code) {
      const datasheetUrl = `truper_export/${p.code}/${p.code}-ficha.pdf`;

      fetch(datasheetUrl, { method: "HEAD" })
        .then(resp => {
          if (resp.ok) {
            // si alguna vez quieres volver a mostrar el botón,
            // aquí bastaría con quitar el !important del HTML
            pdDatasheetRow.style.display = "block";
            pdDatasheet.onclick = () => window.open(datasheetUrl, "_blank");
          } else {
            pdDatasheetRow.style.display = "none";
          }
        })
        .catch(() => {
          pdDatasheetRow.style.display = "none";
        });
    }
  }

  // Generar hasta 5 fotos por código
  let images = [];

  if (Array.isArray(p.images) && p.images.length > 1) {
    images = p.images;
  } else if (p.code) {
    for (let i = 1; i <= 5; i++) {
      images.push(`truper_export/${p.code}/images/${p.code}-${i}.jpg`);
    }
  } else {
    images = ["img/placeholder.jpg"];
  }

  currentProd.images = images;

  gMain.src = images[0];
  gMain.alt = name;

  gThumbs.innerHTML = images.map((src,i)=>`
    <img src="${src}" data-idx="${i}" class="${i===0?'active':''}"
         alt="vista ${i+1}" onerror="this.src='img/placeholder.jpg'">
  `).join("");

  // Bloquear el scroll del fondo mientras el modal está abierto
  lockBodyScroll();

  if (typeof productModal.showModal === "function") {
    productModal.showModal();
  } else {
    productModal.setAttribute("open","open");
  }
}

// Cerrar modal de producto al hacer click fuera y restaurar scroll
if (productModal) {
  // cuando se cierra (botón, ESC, etc.)
  productModal.addEventListener("close", () => {
    unlockBodyScroll();
  });

  // click en el fondo (fuera del cuadro rojo .product-detail)
  productModal.addEventListener("click", (e) => {
    const inner = e.target.closest(".product-detail");
    if (!inner) {
      productModal.close();
    }
  });
}


// Cuando el modal de producto se cierra (botón "Cerrar" o ESC),
// quitamos el bloqueo de scroll
if (productModal) {
  productModal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
  });

  // Cerrar haciendo click fuera del cuadro rojo
  productModal.addEventListener("click", (e) => {
    const inner = e.target.closest(".product-detail"); // el cuadro rojo
    if (!inner) {
      productModal.close();
    }
  });
}


function setMainImage(idx) {
  if (!currentProd) return;
  const len = currentProd.images.length;
  currentImgIndex = (idx + len) % len;
  gMain.src = currentProd.images[currentImgIndex];

  Array.from(gThumbs.querySelectorAll("img")).forEach((im, i) => {
    im.classList.toggle("active", i === currentImgIndex);
  });
}

// =================== RENDER Y FILTROS ===================
function render(products) {
  grid.setAttribute("aria-busy", "true");

  // Guardamos el listado completo filtrado
  lastList = products || [];

  const totalItems = lastList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  // ← aquí hacemos el paginado
  const start = (currentPage - 1) * pageSize;
  const pageItems = lastList.slice(start, start + pageSize);

  // Render de SOLO la página actual
  grid.innerHTML = pageItems.map(p => {
    const name = p.description || p.title || `Producto ${p.code || ""}`;
    const categoryText = p.category || (p.brand ? p.brand.toUpperCase() : "otros");

    const unitPrice = (typeof p.bs_price_web === "number" && !isNaN(p.bs_price_web))
      ? p.bs_price_web
      : (p.price || 0);

    const mainImage =
      (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) ||
      (p.code ? `truper_export/${p.code}/images/${p.code}-1.jpg`
              : "img/placeholder.jpg");

    const basePriceBs =
      (typeof p.bs_price_descuento25 === "number" && p.bs_price_descuento25 > unitPrice)
        ? p.bs_price_descuento25
        : null;

    const saleLabel = p.sale_label || p.mode_of_sale || "";
    const hasPromo = p.has_promo === true;

    return `
      <article class="card" data-open="${p.id}">
        ${hasPromo ? `<span class="promo-flag">PROMO</span>` : ""}

        <img loading="lazy"
             src="${mainImage}"
             alt="${name}"
             onerror="this.src='img/placeholder.jpg'">

        <div class="info">
          <h3>${name}</h3>
          <p class="meta-line">
            ${categoryText}${p.code ? " · " + p.code : ""}
          </p>
          ${saleLabel ? `<p class="sale-label">${saleLabel}</p>` : ""}

          <div class="price-row">
            ${basePriceBs ? `<span class="price-old">${fmt(basePriceBs)}</span>` : ""}
            <span class="price">${fmt(unitPrice)}</span>
          </div>
        </div>

        <button data-id="${p.id}">Añadir al carrito</button>
      </article>
    `;
  }).join("");

  grid.setAttribute("aria-busy", "false");

  // ← actualizamos el paginador
  updatePager(totalItems);
}


function applyFilters() {
  const q    = (searchInput?.value || "").toLowerCase();
  const cat  = filterCategory?.value || "";
  const sort = filterSort?.value || "";

  let list = PRODUCTS.map(p => {
    const text  = ((p.description || p.title || "") + " " + (p.sale_label || "")).toLowerCase();
    let brand   = (p.brand || "").toLowerCase();

    if (!brand || brand === "truper") {
      if (text.includes("pretul")) brand = "pretul";
      else if (text.includes("foset")) brand = "foset";
      else if (text.includes("fiero")) brand = "fiero";
      else if (text.includes("hermex")) brand = "hermex";
      else if (text.includes("volteck") || text.includes("voltek")) brand = "volteck";
      else if (text.includes("klintek")) brand = "klintek";
      else brand = "truper";
    }

    return { ...p, brand };
  });

    list = list.filter(p => {
    const okBrand = !activeBrand || p.brand === activeBrand;
    const okCat   = !cat || p.category === cat;

    const nameText = (p.description || p.title || "").toLowerCase();
    const descText = (p.sale_label || "").toLowerCase();
    const codeText = String(p.code || p.productCode || "").toLowerCase();

    const okText = !q || (
      nameText.includes(q) ||
      descText.includes(q) ||
      codeText.includes(q)
    );

    // ⚠️ NO mostrar productos descontinuados
    const okNotDisc = !p.es_descontinuado;   // true si NO es descontinuado

    // ⚠️ NO mostrar productos que usen la imagen placeholder.jpg
    const isPlaceholder =
      Array.isArray(p.images) &&
      p.images.length === 1 &&
      typeof p.images[0] === "string" &&
      p.images[0].includes("placeholder.jpg");

    const okImage = !isPlaceholder;

    return okBrand && okCat && okText && okNotDisc && okImage;
  });



    // ----- Orden base: más estrellas primero -----
  // estrella_score viene del Excel (DISC.ESTRE) vía generar_productos.py
  list.sort((a, b) => {
    const sa = a.estrella_score || 0;
    const sb = b.estrella_score || 0;

    // primero por estrellas (descendente)
    if (sb !== sa) return sb - sa;

    // si tienen las mismas estrellas, ordenar por descripción alfabética
    return (a.description || "").localeCompare(b.description || "");
  });


  const getUnit = (p) => {
    if (typeof p.bs_price_web === "number" && !isNaN(p.bs_price_web)) {
      return p.bs_price_web;
    }
    return p.price || 0;
  };

  if (sort === "price-asc")  list.sort((a, b) => getUnit(a) - getUnit(b));
  if (sort === "price-desc") list.sort((a, b) => getUnit(b) - getUnit(a));

  currentPage = 1;
  render(list);
  scrollToGridTop();


}

function showPromotions() {
  const promos = PRODUCTS.filter(p => p.has_promo || (p.promo_percent > 0));
  currentPage = 1;
  render(promos);
  scrollToGridTop();
}


// ======================================================
// Cargar y mezclar las IMÁGENES de productos.json
// ======================================================
async function cargarImagenesDesdeProductosJson() {
  try {
    const resp = await fetch('productos.json');
    if (!resp.ok) {
      console.warn('No se pudo cargar productos.json para las imágenes');
      return;
    }

    const data = await resp.json();

    // Mapa: código -> array de imágenes
    const imagenesPorCodigo = {};
    data.forEach(p => {
      const code = String(p.code || '').trim();
      if (!code) return;

      if (Array.isArray(p.images) && p.images.length > 0) {
        imagenesPorCodigo[code] = p.images;
      }
    });

    // Mezclar en PRODUCTS (viene de productos.js)
    PRODUCTS.forEach(p => {
      const code = String(p.code || '').trim();
      const imgs = imagenesPorCodigo[code];

      if (imgs && imgs.length > 0) {
        // Usar las fotos reales del catálogo
        p.images = imgs;
      } else {
        // Fallback: si no hay en el JSON de fotos, usamos mínimo 1 imagen o placeholder
        if (!Array.isArray(p.images) || p.images.length === 0) {
          if (code) {
            p.images = [`truper_export/${code}/images/${code}-1.jpg`];
          } else {
            p.images = ['img/placeholder.jpg'];
          }
        }
      }
    });

    // Volver a dibujar la grilla pero ahora con todas las fotos
    applyFilters();
  } catch (err) {
    console.error('Error cargando imágenes desde productos.json', err);
  }
}


// =================== EVENTOS GRID Y CARRITO ===================
grid.addEventListener("click", e => {
  const btn = e.target.closest("button[data-id]");
  if (btn) {
    const id = Number(btn.dataset.id);
    const found = cart.find(i => i.id === id);
    if (found) found.qty++;
    else cart.push({ id, qty: 1 });
    syncCart();
    cartPanel.classList.add("open");
    cartPanel.setAttribute("aria-hidden", "false");
    return;
  }

  const card = e.target.closest(".card");
  if (card) {
    const id = Number(card.dataset.open);
    openProduct(id);
  }
});

filterCategory?.addEventListener("change", applyFilters);
filterSort?.addEventListener("change", applyFilters);
searchInput?.addEventListener("input", applyFilters);

cartItems.addEventListener("click", e => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id  = Number(btn.dataset.id);
  const act = btn.dataset.action;
  const it  = cart.find(i => i.id === id);
  if (!it) return;
  if (act === "inc") it.qty++;
  if (act === "dec") {
    it.qty--;
    if (it.qty <= 0) cart = cart.filter(i => i.id !== id);
  }
  syncCart();
});

cartBtn.addEventListener("click", () => {
  cartPanel.classList.toggle("open");
  const open = cartPanel.classList.contains("open");
  cartPanel.setAttribute("aria-hidden", String(!open));
});

closeCart.addEventListener("click", () => {
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
});

// Cerrar carrito al hacer clic fuera
document.addEventListener("mousedown", (e) => {
  if (!cartPanel.classList.contains("open")) return;
  const clickedInsideCart = e.target.closest("#cartPanel");
  const clickedCartBtn    = e.target.closest("#cartBtn");
  if (clickedInsideCart || clickedCartBtn) return;
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
});

// Modal: navegación de galería + zoom + add
gPrev?.addEventListener("click", () => setMainImage(currentImgIndex - 1));
gNext?.addEventListener("click", () => setMainImage(currentImgIndex + 1));
gThumbs?.addEventListener("click", e => {
  const t = e.target.closest("img[data-idx]");
  if (!t) return;
  setMainImage(Number(t.dataset.idx));
});
gMain?.addEventListener("dblclick", () => {
  gMain.style.objectFit = (gMain.style.objectFit === "cover" ? "contain" : "cover");
});
pdAdd?.addEventListener("click", () => {
  if (!currentProd) return;
  const id = currentProd.id;
  const it = cart.find(i => i.id === id);
  if (it) it.qty++;
  else cart.push({ id, qty: 1 });
  syncCart();
  productModal.close?.();
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
});
productModal?.addEventListener("cancel", () => productModal.close?.());

// =================== MARCAS (DESKTOP + MÓVIL) ===================
document.querySelector(".brand-row")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".brand-badge");
  if (!btn) return;

  document.querySelectorAll(".brand-badge").forEach(b => b.classList.remove("is-active"));
  btn.classList.add("is-active");

  activeBrand = (btn.dataset.brand || "").toLowerCase();
  if (searchInput) searchInput.value = "";
  applyFilters();
  cargarImagenesDesdeProductosJson();
});

document.getElementById("btnPromos")?.addEventListener("click", showPromotions);

// Hoja móvil
(() => {
  const brandToggle  = document.getElementById("brandToggle");
  const brandSheet   = document.getElementById("brandSheet");
  const closeBrands  = document.getElementById("closeBrands");
  const closeBrands2 = document.getElementById("closeBrands2");
  const sheetBrands  = document.querySelector(".sheet-brands");

  if (!brandToggle || !brandSheet) return;

  function openBrandSheet() {
    brandSheet.classList.add("open");
    brandSheet.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }
  function closeBrandSheet() {
    brandSheet.classList.remove("open");
    brandSheet.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  brandToggle.addEventListener("click", openBrandSheet);
  closeBrands?.addEventListener("click", closeBrandSheet);
  closeBrands2?.addEventListener("click", closeBrandSheet);

  brandSheet.addEventListener("click", (e) => {
    if (e.target === brandSheet) closeBrandSheet();
  });

  sheetBrands?.addEventListener("click", (e) => {
    const btn = e.target.closest(".brand-badge");
    if (!btn) return;

    sheetBrands.querySelectorAll(".brand-badge").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    document.querySelectorAll(".brand-row .brand-badge").forEach(b => {
      b.classList.toggle("is-active", (b.dataset.brand || "") === (btn.dataset.brand || ""));
    });

    activeBrand = (btn.dataset.brand || "").toLowerCase();
    if (searchInput) searchInput.value = "";
    applyFilters();
    // Cargar y mezclar imágenes reales UNA sola vez al iniciar
    cargarImagenesDesdeProductosJson();

  });
})();

// =================== MAPA + CHECKOUT + QR ===================
let map, marker, currentLatLng = null;

function ensureMap() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  if (!window.L) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => setUpMap();
    document.head.appendChild(s);
    return;
  }
  setUpMap();

  function setUpMap() {
    if (!map) {
      map = L.map("map");
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);
      marker = L.marker([-16.5, -68.15], { draggable: true }).addTo(map);
      marker.on("moveend", (e) => {
        currentLatLng = e.target.getLatLng();
        saveProfile();
      });
    }
    const p = JSON.parse(localStorage.getItem("profile") || "{}");
    const lat = (p.lat ?? -16.5), lng = (p.lng ?? -68.15);
    map.setView([lat, lng], 14);
    marker.setLatLng([lat, lng]);
    setTimeout(() => map.invalidateSize(), 150);
  }
}

const useMyLocation = $("#useMyLocation");
useMyLocation?.addEventListener("click", () => {
  if (!map) return;
  map.locate({ setView: true, maxZoom: 16 });
  map.once("locationfound", (e) => {
    currentLatLng = e.latlng;
    marker.setLatLng(e.latlng);
    saveProfile();
  });
});

checkoutBtn?.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  // 1) Subtotal SIN descuento (suma de productos)
  const subtotal = cart.reduce((s, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    if (!p) return s;
    const unitPrice = (typeof p.bs_price_web === "number" && !isNaN(p.bs_price_web))
      ? p.bs_price_web
      : (p.price || 0);
    return s + unitPrice * i.qty;
  }, 0);

  let totalFinal = subtotal;
  let descuentoMonto = 0;
  let descuentoPorc = 0;

  // 2) Ver si hay empresa logueada y aplicar su descuento
  const empresa = getEmpresaActual();
  if (empresa && empresa.id) {
    try {
      const resp = await fetch(`/api/empresas/${empresa.id}`);
      const data = await resp.json();
      if (data.ok && data.empresa && Number(data.empresa.descuento) > 0) {
        descuentoPorc = Number(data.empresa.descuento);
        descuentoMonto = subtotal * (descuentoPorc / 100);
        totalFinal = subtotal - descuentoMonto;
      }
    } catch (e) {
      console.error("Error obteniendo descuento empresa", e);
    }
  }

  // 3) Actualizar textos en el modal
  if (checkoutSubtotal) {
    checkoutSubtotal.textContent = fmt(subtotal);
  }
  if (checkoutTotalFinal) {
    checkoutTotalFinal.textContent = fmt(totalFinal);
  }
  if (checkoutTotal) {
    // Total grande arriba del QR
    checkoutTotal.textContent = fmt(totalFinal);
  }

  if (checkoutDiscountRow && checkoutDiscountText) {
    if (descuentoMonto > 0) {
      checkoutDiscountRow.style.display = "flex";
      // Ej: "50% (-Bs 12,01)"
      checkoutDiscountText.textContent =
        `${descuentoPorc}% (${fmt(-descuentoMonto)})`;
    } else {
      checkoutDiscountRow.style.display = "none";
      checkoutDiscountText.textContent = "—";
    }
  }

  // 4) Cargar perfil, crear QR y abrir modal
  loadProfile();

  const orderId = "ORD-" + Date.now().toString().slice(-6);
  qrcodeBox.innerHTML = "";
  const textForQR = `Pago MiTienda.bo
Pedido: ${orderId}
Total: ${totalFinal.toFixed(2)} BOB
Nombre: ${c_name.value || "(por completar)"}
Tel: ${c_phone.value || "(por completar)"}`;

  new QRCode(qrcodeBox, { text: textForQR, width: 200, height: 200 });

  checkoutModal.showModal?.();
  ensureMap();

  // Bloquear scroll del fondo mientras está abierto el checkout
  document.body.classList.add("modal-open");

  // Guardar datos para WhatsApp y para actualizar el QR en vivo
  sendWhatsApp.dataset.order = orderId;
  sendWhatsApp.dataset.total = totalFinal;
});





[c_name, c_phone].forEach(inp => {
  inp?.addEventListener("input", () => {
    const orderId = sendWhatsApp.dataset.order || "ORD-XXXXXX";
    const total = Number(sendWhatsApp.dataset.total || 0);
    qrcodeBox.innerHTML = "";
    const textForQR = `Pago MiTienda.bo
Pedido: ${orderId}
Total: ${total} BOB
Nombre: ${c_name.value}
Tel: ${c_phone.value}`;
    new QRCode(qrcodeBox, { text: textForQR, width: 200, height: 200 });
  });
});

sendWhatsApp?.addEventListener("click", async () => {
  const orderId = sendWhatsApp.dataset.order || "ORD-XXXXXX";
  const total   = Number(sendWhatsApp.dataset.total || 0);

  const name     = c_name?.value.trim() || "";
  const lastname = c_lastname?.value.trim() || "";
  const phone    = c_phone?.value.trim() || "";
  const city     = c_city?.value || "";
  const type     = c_type?.value || "";
  const number   = c_number?.value.trim() || "";
  const address  = c_address?.value.trim() || "";
  const notes    = c_notes?.value.trim() || "";

  saveProfile();

  // Si hay empresa logueada, guardar el pedido en el servidor
  let empresaInfo = localStorage.getItem("empresaInfo");
  if (empresaInfo) {
    try {
      await guardarPedidoEmpresa(cart, total, notes);
    } catch (err) {
      console.error("No se pudo guardar pedido de empresa:", err);
      // Igual seguimos con WhatsApp
    }
  }

  const myNumber = "59176920918";
  const itemsList = cart.map(i => {
    const p = PRODUCTS.find(p => p.id === i.id);
    if (!p) return "";
    const unitPrice = (typeof p.bs_price_web === "number" && !isNaN(p.bs_price_web))
      ? p.bs_price_web
      : (p.price || 0);
    return `- ${(p.description || p.title)} x${i.qty} = ${(unitPrice * i.qty).toFixed(2)} BOB`;
  }).join("\n");

  const msg =
`Hola, envío comprobante.

Pedido: ${orderId}
Total: ${total.toFixed(2)} BOB

Nombre: ${name} ${lastname}
Teléfono: ${phone}
Departamento: ${city}
Tipo: ${type}
N°/Piso: ${number}
Dirección: ${address}
Notas: ${notes}

Items:
${itemsList}`;

  const url = `https://wa.me/${myNumber}?text=${encodeURIComponent(msg)}`;
  window.location.href = url;
});


// Cierre de checkout
function closeCheckoutModal() {
  // quitar bloqueo de scroll al cerrar el modal
  document.body.classList.remove("modal-open");

  if (typeof checkoutModal?.close === "function") {
    checkoutModal.close();
  } else {
    checkoutModal?.removeAttribute("open");
  }
}

$("#closeCheckout")?.addEventListener("click", closeCheckoutModal);
checkoutModal?.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeCheckoutModal();
});
checkoutModal?.addEventListener("click", (e) => {
  if (e.target === checkoutModal) closeCheckoutModal();
});


prevPageBtn?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    render(lastList);
    scrollToGridTop();
  }
});

nextPageBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil((lastList.length || 0) / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    render(lastList);
    scrollToGridTop();
  }
});

prevPageBtnBottom?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    render(lastList);
    scrollToGridTop();
  }
});

nextPageBtnBottom?.addEventListener("click", () => {
  const totalPages = Math.ceil((lastList.length || 0) / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    render(lastList);
    scrollToGridTop();
  }
});



// =================== INICIO ===================
applyFilters();
syncCart();
console.log("app.js cargó LIMPIO ✅");
