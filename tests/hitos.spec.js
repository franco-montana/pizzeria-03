import { test, expect } from '@playwright/test';

const pizzas = Array.from({ length: 6 }, (_, i) => ({
  id: `p00${i + 1}`, name: ['Napolitana', 'Española', 'Pepperoni', 'Hawaiana', 'Vegetariana', 'Cuatro quesos'][i],
  price: 5950 + i * 1000, ingredients: ['mozzarella', 'orégano'],
  img: '/src/assets/header-background.jpg', desc: `Descripción de pizza ${i + 1}`,
}));
const email = 'prueba@example.com';
const token = 'jwt-de-prueba'; // Fixture de contrato; no autentica contra el backend real.

async function mockApi(page, options = {}) {
  const requests = [];
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    requests.push({ path, method: request.method(), body: request.postDataJSON(), authorization: request.headers().authorization });
    let status = 200;
    let json;
    if (path === '/api/pizzas') {
      status = options.catalogError ? 500 : 200;
      json = options.catalogError ? { error: 'Catálogo no disponible' } : pizzas;
    } else if (path.startsWith('/api/pizzas/')) {
      json = pizzas.find(pizza => path.endsWith(pizza.id));
      if (!json) { status = 404; json = { error: 'Pizza no encontrada' }; }
    } else if (path === '/api/auth/me') {
      status = options.expired ? 401 : 200;
      json = options.expired ? { error: 'Token vencido' } : { email };
    } else if (path === '/api/auth/login' || path === '/api/auth/register') {
      status = options.authError ? 401 : 200;
      json = options.authError ? { error: 'Credenciales inválidas' } : { email, token };
    } else if (path === '/api/checkouts') {
      status = options.checkoutError ? 500 : 200;
      json = options.checkoutError ? { error: 'No se pudo procesar la compra' } : { message: 'OK' };
    } else { status = 404; json = { error: 'Ruta desconocida' }; }
    await route.fulfill({ status, json });
  });
  return requests;
}

async function signIn(page, registerMode = false) {
  await page.getByRole('link', { name: registerMode ? 'REGISTRATE!' : 'INGRESA' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('123123');
  if (registerMode) await page.getByLabel('Confirmar contraseña').fill('123123');
  await page.getByRole('button', { name: registerMode ? 'Crear cuenta' : 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Profile', exact: true })).toBeVisible();
}

test('catálogo API, seis tarjetas, ingredientes, detalle dinámico y total compartido', async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Ver más' })).toHaveCount(6);
  await expect(page.locator('.card li')).toHaveCount(12);
  await page.getByRole('link', { name: 'Ver más' }).nth(1).click();
  await expect(page).toHaveURL(/pizza\/p002$/);
  await expect(page.getByRole('heading', { name: 'Pizza Española' })).toBeVisible();
  await expect(page.getByText('Descripción de pizza 2')).toBeVisible();
  await page.getByRole('button', { name: 'Añadir al carrito' }).click();
  await expect(page.getByRole('link', { name: /Total:/ })).toContainText('6.950');
  expect(requests.some(r => r.path === '/api/pizzas/p002')).toBeTruthy();
});

test('carrito aumenta, disminuye, elimina en cero y bloquea pago sin sesión', async ({ page }) => {
  await mockApi(page); await page.goto('/');
  await page.getByRole('button', { name: 'Añadir al Carrito' }).first().click();
  await page.getByRole('link', { name: /Total:/ }).click();
  await expect(page.getByRole('button', { name: 'Pagar', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Aumentar Napolitana' }).click();
  await expect(page.getByRole('heading', { name: 'Total: $11.900' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Total:/ })).toContainText('11.900');
  await page.getByRole('button', { name: 'Disminuir Napolitana' }).click();
  await page.getByRole('button', { name: 'Disminuir Napolitana' }).click();
  await expect(page.getByText('No hay productos en el carrito.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Total: $0' })).toBeVisible();
});

for (const registerMode of [false, true]) {
  test(`${registerMode ? 'registro' : 'login'} valida campos y autentica mediante API`, async ({ page }) => {
    const requests = await mockApi(page); await page.goto(registerMode ? '/register' : '/login');
    const submit = page.getByRole('button', { name: registerMode ? 'Crear cuenta' : 'Iniciar sesión', exact: true });
    await submit.click(); await expect(page.getByRole('alert')).toContainText('obligatorios');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('123');
    if (registerMode) await page.getByLabel('Confirmar contraseña').fill('123');
    await submit.click(); await expect(page.getByRole('alert')).toContainText('6 caracteres');
    await page.getByLabel('Contraseña', { exact: true }).fill('123123');
    if (registerMode) {
      await submit.click(); await expect(page.getByRole('alert')).toContainText('iguales');
      await page.getByLabel('Confirmar contraseña').fill('123123');
    }
    await submit.click();
    await expect(page.getByRole('status')).toContainText('exitoso');
    expect(requests.find(r => r.path === `/api/auth/${registerMode ? 'register' : 'login'}`).body).toEqual({ email, password: '123123' });
    await page.getByRole('link', { name: 'Profile', exact: true }).click();
    await expect(page.getByText(`Email: ${email}`)).toBeVisible();
    expect(requests.find(r => r.path === '/api/auth/me').authorization).toBe(`Bearer ${token}`);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
}

test('rutas protegidas y exclusivas para invitados; logout del navbar', async ({ page }) => {
  await mockApi(page); await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page);
  // Navegación interna conserva el estado en memoria del contexto.
  for (const path of ['/login', '/register']) {
    await page.evaluate(path => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }, path);
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
  }
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page.getByRole('link', { name: 'INGRESA' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Profile', exact: true })).toHaveCount(0);
});

test('checkout envía Bearer y cantidades, muestra éxito y vacía el carrito', async ({ page }) => {
  const requests = await mockApi(page); await page.goto('/');
  await page.getByRole('button', { name: 'Añadir al Carrito' }).first().click();
  await signIn(page);
  await page.getByRole('link', { name: /Total:/ }).click();
  await page.getByRole('button', { name: 'Pagar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Compra realizada con éxito');
  const checkout = requests.find(r => r.path === '/api/checkouts');
  expect(checkout.method).toBe('POST'); expect(checkout.authorization).toBe(`Bearer ${token}`);
  expect(checkout.body.cart[0]).toMatchObject({ id: 'p001', count: 1 });
  await expect(page.getByRole('heading', { name: 'Total: $0' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pagar', exact: true })).toBeDisabled();
});

test('errores de pago conservan el carrito y permiten reintentar', async ({ page }) => {
  await mockApi(page, { checkoutError: true }); await page.goto('/');
  await page.getByRole('button', { name: 'Añadir al Carrito' }).first().click(); await signIn(page);
  await page.getByRole('link', { name: /Total:/ }).click();
  await page.getByRole('button', { name: 'Pagar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo procesar');
  await expect(page.getByRole('heading', { name: 'Total: $5.950' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pagar', exact: true })).toBeEnabled();
});

test('rechazo de credenciales no muestra éxito ni abre perfil', async ({ page }) => {
  await mockApi(page, { authError: true }); await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('123123');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Credenciales inválidas');
  await expect(page.getByRole('link', { name: 'Profile', exact: true })).toHaveCount(0);
});

test('perfil con token vencido cierra sesión y redirige a login', async ({ page }) => {
  await mockApi(page, { expired: true }); await page.goto('/'); await signIn(page);
  await page.getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('link', { name: 'INGRESA' })).toBeVisible();
});

test('errores de catálogo, pizza inexistente y rutas 404 tienen mensajes', async ({ page }) => {
  await mockApi(page, { catalogError: true }); await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Catálogo no disponible');
  await page.goto('/pizza/p999'); await expect(page.getByRole('alert')).toContainText('Pizza no encontrada');
  for (const path of ['/404', '/ruta-inexistente']) {
    await page.goto(path); await expect(page.getByRole('heading', { name: /404/ })).toBeVisible();
    await page.getByRole('link', { name: 'Volver al inicio' }).click();
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
  }
});

test('móvil: menú, carrito y formulario sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page); await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('link', { name: /Total:/ })).toBeVisible();
  await page.getByRole('link', { name: 'REGISTRATE!' }).click();
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
