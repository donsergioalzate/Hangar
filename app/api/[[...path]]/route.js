import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function ok(data, status = 200) {
  return NextResponse.json(data, { status });
}
function err(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function getSession(req) {
  return await getServerSession(authOptions);
}

async function generateFolio(db) {
  const count = await db.collection('quotes').countDocuments();
  return `HNG-${String(count + 1).padStart(3, '0')}`;
}

async function checkStockOverlap(db, propId, startDate, endDate) {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const overlap = await db.collection('quotes').findOne({
    status: 'CONFIRMED',
    startDate: { $lte: end },
    endDate: { $gte: start },
    'items.propId': propId
  });
  return overlap !== null;
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

function getPath(params) {
  if (!params || !params.path) return [];
  return Array.isArray(params.path) ? params.path : [params.path];
}

// ─── ROUTE HANDLERS ──────────────────────────────────────────────────────────

// POST /api/register
async function handleRegister(req) {
  const { name, email, password, phone, productionCompany } = await req.json();
  if (!name || !email || !password) return err('Nombre, email y contraseña son requeridos');
  if (password.length < 6) return err('La contraseña debe tener al menos 6 caracteres');
  const db = await getDatabase();
  const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (existing) return err('Ya existe una cuenta con este email', 409);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: uuidv4(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    phone: phone || '',
    productionCompany: productionCompany || '',
    role: 'CLIENT',
    createdAt: new Date()
  };
  await db.collection('users').insertOne(user);
  return ok({ message: 'Usuario registrado exitosamente', userId: user.id }, 201);
}

// GET /api/props
async function handleGetProps(req) {
  const db = await getDatabase();
  const url = new URL(req.url);
  const categoryId = url.searchParams.get('categoryId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const search = url.searchParams.get('search');

  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const props = await db.collection('props').find(filter).sort({ createdAt: -1 }).toArray();

  // Add stock warning if dates provided
  if (startDate && endDate) {
    for (let prop of props) {
      if (!prop.stockOverride) {
        prop.hasStockWarning = await checkStockOverlap(db, prop.id, startDate, endDate);
      } else {
        prop.hasStockWarning = false;
      }
    }
  }

  return ok(props);
}

// POST /api/props
async function handleCreateProp(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const body = await req.json();
  const { name, dimensions, description, pricePerDay, categoryId, images, stockOverride } = body;
  if (!name || !pricePerDay) return err('Nombre y precio son requeridos');
  if (images && images.length > 5) return err('Máximo 5 imágenes por prop');
  const db = await getDatabase();
  const prop = {
    id: uuidv4(),
    name,
    dimensions: dimensions || '',
    description: description || '',
    pricePerDay: Number(pricePerDay),
    categoryId: categoryId || '',
    images: (images || []).map((img, i) => ({
      id: uuidv4(),
      url: img.url || img,
      isMain: i === 0
    })),
    stockOverride: stockOverride || false,
    createdAt: new Date()
  };
  await db.collection('props').insertOne(prop);
  return ok(prop, 201);
}

// GET /api/props/:id
async function handleGetProp(req, id) {
  const db = await getDatabase();
  const prop = await db.collection('props').findOne({ id });
  if (!prop) return err('Prop no encontrado', 404);
  return ok(prop);
}

// PUT /api/props/:id
async function handleUpdateProp(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const body = await req.json();
  if (body.images && body.images.length > 5) return err('Máximo 5 imágenes por prop');
  const db = await getDatabase();
  const update = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.dimensions !== undefined) update.dimensions = body.dimensions;
  if (body.description !== undefined) update.description = body.description;
  if (body.pricePerDay !== undefined) update.pricePerDay = Number(body.pricePerDay);
  if (body.categoryId !== undefined) update.categoryId = body.categoryId;
  if (body.stockOverride !== undefined) update.stockOverride = body.stockOverride;
  if (body.images !== undefined) {
    update.images = body.images.map((img, i) => ({
      id: img.id || uuidv4(),
      url: img.url || img,
      isMain: i === 0
    }));
  }
  await db.collection('props').updateOne({ id }, { $set: update });
  const updated = await db.collection('props').findOne({ id });
  return ok(updated);
}

// DELETE /api/props/:id
async function handleDeleteProp(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const db = await getDatabase();
  await db.collection('props').deleteOne({ id });
  return ok({ message: 'Prop eliminado' });
}

// GET /api/categories
async function handleGetCategories() {
  const db = await getDatabase();
  const cats = await db.collection('categories').find({}).sort({ name: 1 }).toArray();
  return ok(cats);
}

// POST /api/categories
async function handleCreateCategory(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const { name, slug, parentId } = await req.json();
  if (!name) return err('Nombre es requerido');
  const db = await getDatabase();
  const cat = {
    id: uuidv4(),
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    parentId: parentId || null
  };
  await db.collection('categories').insertOne(cat);
  return ok(cat, 201);
}

// PUT /api/categories/:id
async function handleUpdateCategory(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const body = await req.json();
  const db = await getDatabase();
  const update = {};
  if (body.name) update.name = body.name;
  if (body.slug) update.slug = body.slug;
  if (body.parentId !== undefined) update.parentId = body.parentId;
  await db.collection('categories').updateOne({ id }, { $set: update });
  const updated = await db.collection('categories').findOne({ id });
  return ok(updated);
}

// DELETE /api/categories/:id
async function handleDeleteCategory(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const db = await getDatabase();
  await db.collection('categories').deleteOne({ id });
  return ok({ message: 'Categoría eliminada' });
}

// GET /api/quotes
async function handleGetQuotes(req) {
  const session = await getServerSession(authOptions);
  if (!session) return err('No autorizado', 401);
  const db = await getDatabase();
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const filter = {};
  if (session.user.role !== 'ADMIN') {
    filter.userId = session.user.id;
  }
  if (status) filter.status = status;
  const quotes = await db.collection('quotes').find(filter).sort({ createdAt: -1 }).toArray();
  return ok(quotes);
}

// POST /api/quotes
async function handleCreateQuote(req) {
  const session = await getServerSession(authOptions);
  if (!session) return err('Debes iniciar sesión para crear una cotización', 401);
  const body = await req.json();
  const { startDate, endDate, notes, items, userName, userEmail, userPhone, userProductionCompany } = body;
  if (!startDate || !endDate) return err('Fechas de inicio y fin son requeridas');
  if (!items || items.length === 0) return err('El carrito está vacío');
  const db = await getDatabase();
  const totalDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
  const totalCost = items.reduce((sum, item) => sum + item.pricePerDay * item.quantity * totalDays, 0);
  const folio = await generateFolio(db);
  const quote = {
    id: uuidv4(),
    folio,
    userId: session.user.id,
    userEmail: userEmail || session.user.email,
    userName: userName || session.user.name,
    userPhone: userPhone || session.user.phone || '',
    userProductionCompany: userProductionCompany || session.user.productionCompany || '',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalDays,
    totalCost,
    notes: notes || '',
    status: 'NEW',
    items: items.map(item => ({
      propId: item.propId,
      propName: item.propName,
      propDimensions: item.dimensions || '',
      pricePerDay: item.pricePerDay,
      quantity: item.quantity,
      subtotal: item.pricePerDay * item.quantity * totalDays
    })),
    createdAt: new Date()
  };
  await db.collection('quotes').insertOne(quote);
  return ok(quote, 201);
}

// GET /api/quotes/:id
async function handleGetQuote(req, id) {
  const session = await getServerSession(authOptions);
  if (!session) return err('No autorizado', 401);
  const db = await getDatabase();
  const quote = await db.collection('quotes').findOne({ id });
  if (!quote) return err('Cotización no encontrada', 404);
  if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) return err('No autorizado', 403);
  return ok(quote);
}

// PUT /api/quotes/:id
async function handleUpdateQuote(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const body = await req.json();
  const db = await getDatabase();
  const update = {};
  if (body.status) update.status = body.status;
  if (body.notes !== undefined) update.notes = body.notes;
  await db.collection('quotes').updateOne({ id }, { $set: update });
  const updated = await db.collection('quotes').findOne({ id });
  return ok(updated);
}

// DELETE /api/quotes/:id
async function handleDeleteQuote(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const db = await getDatabase();
  await db.collection('quotes').deleteOne({ id });
  return ok({ message: 'Cotización eliminada' });
}

// GET /api/hidden-emails
async function handleGetHiddenEmails() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const db = await getDatabase();
  const emails = await db.collection('hiddenEmails').find({}).toArray();
  return ok(emails);
}

// POST /api/hidden-emails
async function handleCreateHiddenEmail(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const { email, department } = await req.json();
  if (!email || !department) return err('Email y departamento son requeridos');
  const db = await getDatabase();
  const he = { id: uuidv4(), email, department };
  await db.collection('hiddenEmails').insertOne(he);
  return ok(he, 201);
}

// DELETE /api/hidden-emails/:id
async function handleDeleteHiddenEmail(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const db = await getDatabase();
  await db.collection('hiddenEmails').deleteOne({ id });
  return ok({ message: 'Email eliminado' });
}

// GET /api/admin/stats
async function handleAdminStats() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const db = await getDatabase();
  const [totalProps, totalCategories, totalUsers, newQuotes, confirmedQuotes, returnedQuotes] = await Promise.all([
    db.collection('props').countDocuments(),
    db.collection('categories').countDocuments(),
    db.collection('users').countDocuments(),
    db.collection('quotes').countDocuments({ status: 'NEW' }),
    db.collection('quotes').countDocuments({ status: 'CONFIRMED' }),
    db.collection('quotes').countDocuments({ status: 'RETURNED' })
  ]);
  const recentQuotes = await db.collection('quotes').find({}).sort({ createdAt: -1 }).limit(5).toArray();
  return ok({ totalProps, totalCategories, totalUsers, newQuotes, confirmedQuotes, returnedQuotes, recentQuotes });
}

// GET /api/admin/users
async function handleAdminUsers() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const db = await getDatabase();
  const users = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).toArray();
  return ok(users);
}

// PUT /api/admin/users/:id
async function handleUpdateAdminUser(req, id) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return err('No autorizado', 403);
  const body = await req.json();
  const db = await getDatabase();
  const update = {};
  if (body.role) update.role = body.role;
  if (body.name) update.name = body.name;
  await db.collection('users').updateOne({ id }, { $set: update });
  const updated = await db.collection('users').findOne({ id }, { projection: { passwordHash: 0 } });
  return ok(updated);
}

// PUT /api/users/profile (update current user profile)
async function handleUpdateProfile(req) {
  const session = await getServerSession(authOptions);
  if (!session) return err('No autorizado', 401);
  const body = await req.json();
  const db = await getDatabase();
  const update = {};
  if (body.name) update.name = body.name;
  if (body.phone !== undefined) update.phone = body.phone;
  if (body.productionCompany !== undefined) update.productionCompany = body.productionCompany;
  await db.collection('users').updateOne({ id: session.user.id }, { $set: update });
  const updated = await db.collection('users').findOne({ id: session.user.id }, { projection: { passwordHash: 0 } });
  return ok(updated);
}

// GET /api/download-image?url=...
async function handleDownloadImage(req) {
  const url = new URL(req.url);
  const imageUrl = url.searchParams.get('url');
  if (!imageUrl) return err('URL requerida');
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="prop-image.jpg"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (e) {
    return err('No se pudo descargar la imagen');
  }
}

// POST /api/seed - Create sample data
async function handleSeed() {
  const db = await getDatabase();

  // Clear existing data
  await Promise.all([
    db.collection('users').deleteMany({}),
    db.collection('categories').deleteMany({}),
    db.collection('props').deleteMany({}),
    db.collection('quotes').deleteMany({}),
    db.collection('hiddenEmails').deleteMany({})
  ]);

  // Create users
  const adminHash = await bcrypt.hash('Hangar2024!', 12);
  const clientHash = await bcrypt.hash('Cliente123!', 12);
  const users = [
    { id: uuidv4(), name: 'Admin Hangar', email: 'admin@hangar.mx', passwordHash: adminHash, phone: '5512345678', productionCompany: 'Hangar Props', role: 'ADMIN', createdAt: new Date() },
    { id: uuidv4(), name: 'María García', email: 'cliente@prueba.mx', passwordHash: clientHash, phone: '5598765432', productionCompany: 'Producción XYZ', role: 'CLIENT', createdAt: new Date() }
  ];
  await db.collection('users').insertMany(users);

  // Create categories
  const cats = [
    { id: uuidv4(), name: 'Sillas y Sillones', slug: 'sillas-sillones', parentId: null },
    { id: uuidv4(), name: 'Mesas', slug: 'mesas', parentId: null },
    { id: uuidv4(), name: 'Sofás y Chaise', slug: 'sofas-chaise', parentId: null },
    { id: uuidv4(), name: 'Iluminación', slug: 'iluminacion', parentId: null },
    { id: uuidv4(), name: 'Decoración', slug: 'decoracion', parentId: null },
    { id: uuidv4(), name: 'Arte y Cuadros', slug: 'arte-cuadros', parentId: null }
  ];
  await db.collection('categories').insertMany(cats);

  const catMap = {};
  cats.forEach(c => { catMap[c.name] = c.id; });

  // Create props with Unsplash images
  const props = [
    {
      id: uuidv4(), name: 'Sillón Vintage Terciopelo', dimensions: '90 x 85 x 100 cm',
      description: 'Elegante sillón tapizado en terciopelo verde botella. Ideal para producciones de época y editoriales de moda.',
      pricePerDay: 800, categoryId: catMap['Sillas y Sillones'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1600620195943-eb20d00a556f?w=800&q=80', isMain: true },
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1740154093925-ffb8e7ae526e?w=800&q=80', isMain: false }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Silla Estilo Industrial', dimensions: '45 x 50 x 85 cm',
      description: 'Silla de metal negro con asiento de madera. Perfecta para escenas urbanas y contemporáneas.',
      pricePerDay: 350, categoryId: catMap['Sillas y Sillones'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1637527571399-5b3e1cb9d8f2?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Mesa de Comedor Art Déco', dimensions: '180 x 90 x 76 cm',
      description: 'Mesa de comedor rectangular con tablero de vidrio y base de hierro forjado. Capacidad para 8 personas.',
      pricePerDay: 1200, categoryId: catMap['Mesas'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1577176434922-803273eba97a?w=800&q=80', isMain: true },
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1516889454133-d3cd87326a6b?w=800&q=80', isMain: false }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Velador Mid-Century', dimensions: '55 x 55 x 60 cm',
      description: 'Mesa auxiliar de madera maciza con patas cónicas. Estilo mid-century modern.',
      pricePerDay: 450, categoryId: catMap['Mesas'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1544691560-fc2053d97726?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Sofá Chester Cuero', dimensions: '220 x 90 x 80 cm',
      description: 'Sofá Chesterfield de cuero genuino color cognac. Tres plazas. Ideal para sets de entrevistas y ambientes clásicos.',
      pricePerDay: 1800, categoryId: catMap['Sofás y Chaise'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Chaise Longue Terciopelo', dimensions: '180 x 70 x 85 cm',
      description: 'Chaise longue de terciopelo rosa palo. Pieza statement para editoriales de lujo y fashion films.',
      pricePerDay: 1400, categoryId: catMap['Sofás y Chaise'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Lámpara de Pie Art Nouveau', dimensions: '40 x 40 x 175 cm',
      description: 'Lámpara de pie con pantalla de vidrio emplomado y base de bronce. Funcional con socket E27.',
      pricePerDay: 650, categoryId: catMap['Iluminación'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Araña de Cristal Venecia', dimensions: '80 cm diámetro x 90 cm alto',
      description: 'Araña de techo con cristales de murano y estructura dorada. 12 puntos de luz. Ambiente de lujo y opulencia.',
      pricePerDay: 2200, categoryId: catMap['Iluminación'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Librería Vintage Roble', dimensions: '120 x 35 x 200 cm',
      description: 'Librería de 5 estantes en madera de roble envejecida. Con libros y objetos decorativos incluidos.',
      pricePerDay: 900, categoryId: catMap['Decoración'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1613235061012-4adfdb66f12c?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Espejo Antiguo Dorado', dimensions: '80 x 5 x 120 cm',
      description: 'Espejo con marco tallado en madera dorada al pan de oro. Estilo Luis XV. Impacto visual garantizado.',
      pricePerDay: 750, categoryId: catMap['Decoración'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Gabinete Chino Lacado', dimensions: '100 x 45 x 140 cm',
      description: 'Gabinete lacado en negro con incrustaciones de nácar. Estilo chinoiserie. Dos puertas y cajones.',
      pricePerDay: 1100, categoryId: catMap['Arte y Cuadros'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1721119211162-2c3f2809d190?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    },
    {
      id: uuidv4(), name: 'Cómoda Provenzal Blanca', dimensions: '110 x 50 x 90 cm',
      description: 'Cómoda de estilo provenzal pintada en blanco envejecido. 4 cajones con herrajes de bronce.',
      pricePerDay: 850, categoryId: catMap['Decoración'],
      images: [
        { id: uuidv4(), url: 'https://images.unsplash.com/photo-1544691560-fc2053d97726?w=800&q=80', isMain: true }
      ], stockOverride: false, createdAt: new Date()
    }
  ];
  await db.collection('props').insertMany(props);

  // Hidden emails
  const emails = [
    { id: uuidv4(), email: 'bodega@hangar.mx', department: 'Bodega' },
    { id: uuidv4(), email: 'contabilidad@hangar.mx', department: 'Contabilidad' }
  ];
  await db.collection('hiddenEmails').insertMany(emails);

  return ok({
    message: 'Datos de prueba creados exitosamente',
    adminEmail: 'admin@hangar.mx',
    adminPassword: 'Hangar2024!',
    clientEmail: 'cliente@prueba.mx',
    clientPassword: 'Cliente123!'
  });
}

// ─── MAIN ROUTER ─────────────────────────────────────────────────────────────

export async function GET(request, { params }) {
  const path = getPath(params);
  const p0 = path[0] || '';
  const p1 = path[1] || '';
  const p2 = path[2] || '';

  try {
    if (p0 === '' && path.length === 0) return ok({ message: 'Hangar API v1.0', status: 'ok' });
    if (p0 === 'props' && !p1) return handleGetProps(request);
    if (p0 === 'props' && p1) return handleGetProp(request, p1);
    if (p0 === 'categories' && !p1) return handleGetCategories();
    if (p0 === 'quotes' && !p1) return handleGetQuotes(request);
    if (p0 === 'quotes' && p1) return handleGetQuote(request, p1);
    if (p0 === 'hidden-emails' && !p1) return handleGetHiddenEmails();
    if (p0 === 'admin' && p1 === 'stats') return handleAdminStats();
    if (p0 === 'admin' && p1 === 'users' && !p2) return handleAdminUsers();
    if (p0 === 'download-image') return handleDownloadImage(request);
    return ok({ message: 'Hangar API v1.0', status: 'ok' });
  } catch (e) {
    console.error('API Error GET:', e);
    return err('Error interno del servidor', 500);
  }
}

export async function POST(request, { params }) {
  const path = getPath(params);
  const p0 = path[0] || '';

  try {
    if (p0 === 'register') return handleRegister(request);
    if (p0 === 'props') return handleCreateProp(request);
    if (p0 === 'categories') return handleCreateCategory(request);
    if (p0 === 'quotes') return handleCreateQuote(request);
    if (p0 === 'hidden-emails') return handleCreateHiddenEmail(request);
    if (p0 === 'seed') return handleSeed();
    return err('Ruta no encontrada', 404);
  } catch (e) {
    console.error('API Error POST:', e);
    return err('Error interno del servidor', 500);
  }
}

export async function PUT(request, { params }) {
  const path = getPath(params);
  const p0 = path[0] || '';
  const p1 = path[1] || '';
  const p2 = path[2] || '';

  try {
    if (p0 === 'props' && p1) return handleUpdateProp(request, p1);
    if (p0 === 'categories' && p1) return handleUpdateCategory(request, p1);
    if (p0 === 'quotes' && p1) return handleUpdateQuote(request, p1);
    if (p0 === 'admin' && p1 === 'users' && p2) return handleUpdateAdminUser(request, p2);
    if (p0 === 'users' && p1 === 'profile') return handleUpdateProfile(request);
    return err('Ruta no encontrada', 404);
  } catch (e) {
    console.error('API Error PUT:', e);
    return err('Error interno del servidor', 500);
  }
}

export async function DELETE(request, { params }) {
  const path = getPath(params);
  const p0 = path[0] || '';
  const p1 = path[1] || '';

  try {
    if (p0 === 'props' && p1) return handleDeleteProp(request, p1);
    if (p0 === 'categories' && p1) return handleDeleteCategory(request, p1);
    if (p0 === 'quotes' && p1) return handleDeleteQuote(request, p1);
    if (p0 === 'hidden-emails' && p1) return handleDeleteHiddenEmail(request, p1);
    return err('Ruta no encontrada', 404);
  } catch (e) {
    console.error('API Error DELETE:', e);
    return err('Error interno del servidor', 500);
  }
}
