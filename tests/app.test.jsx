import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from '../src/App';

const pizzas = Array.from({ length: 6 }, (_, index) => ({ id: `p00${index + 1}`, name: `Pizza ${index + 1}`, price: 5950, ingredients: ['queso', 'tomate'], img: '/pizza.jpg', desc: `Descripción ${index + 1}` }));
let authError, checkoutError, expired;
beforeEach(() => {
  authError = false; checkoutError = false; expired = false;
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    let status = 200, data;
    const path = new URL(url).pathname;
    if (path === '/api/pizzas') data = pizzas;
    else if (path.startsWith('/api/pizzas/')) {
      data = pizzas.find(pizza => path.endsWith(pizza.id));
      if (!data) { status = 404; data = { error: 'Pizza no encontrada' }; }
    } else if (path === '/api/auth/me') {
      status = expired ? 401 : 200; data = expired ? { error: 'Sesión vencida' } : { email: 'test@example.com' };
    } else if (path === '/api/checkouts') {
      status = checkoutError ? 500 : 200; data = checkoutError ? { error: 'Compra rechazada' } : { message: 'OK' };
    } else {
      status = authError ? 401 : 200; data = authError ? { error: 'Credenciales inválidas' } : { token: 'test-jwt', email: 'test@example.com' };
    }
    return { ok: status < 400, status, json: async () => data };
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const start = (path = '/') => { window.history.replaceState({}, '', path); render(<App />); return userEvent.setup(); };
async function login(user) {
  await user.click(screen.getByRole('link', { name: 'INGRESA' }));
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Contraseña', { exact: true }), '123123');
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión', exact: true }));
  await screen.findByRole('link', { name: 'Profile', exact: true });
}

test('catálogo de seis tarjetas y detalle con useParams', async () => {
  const user = start();
  expect(await screen.findAllByRole('link', { name: /Ver más/ })).toHaveLength(6);
  expect(document.querySelectorAll('.card li')).toHaveLength(12);
  await user.click(screen.getAllByRole('link', { name: /Ver más/ })[1]);
  expect(await screen.findByText('Descripción 2')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/pizzas/p002', expect.any(Object));
});

test('carrito comparte total y elimina al llegar a cero; pagar bloqueado', async () => {
  const user = start();
  await user.click((await screen.findAllByRole('button', { name: /Añadir al Carrito/ }))[0]);
  await user.click(screen.getByRole('link', { name: /Total:/ }));
  expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Aumentar Pizza 1' }));
  expect(screen.getByRole('heading', { name: 'Total: $11.900' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Total:/ })).toHaveTextContent('11.900');
  await user.click(screen.getByRole('button', { name: 'Disminuir Pizza 1' }));
  await user.click(screen.getByRole('button', { name: 'Disminuir Pizza 1' }));
  expect(screen.getByRole('heading', { name: 'Total: $0' })).toBeInTheDocument();
});

for (const register of [false, true]) {
  test(`${register ? 'registro' : 'login'} valida y autentica; perfil usa JWT y logout limpia sesión`, async () => {
    const user = start(register ? '/register' : '/login');
    const button = screen.getByRole('button', { name: register ? 'Crear cuenta' : 'Iniciar sesión', exact: true });
    await user.click(button); expect(screen.getByRole('alert')).toHaveTextContent('obligatorios');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Contraseña', { exact: true }), '123');
    if (register) await user.type(screen.getByLabelText('Confirmar contraseña'), '123');
    await user.click(button); expect(screen.getByRole('alert')).toHaveTextContent('6 caracteres');
    await user.type(screen.getByLabelText('Contraseña', { exact: true }), '123');
    if (register) {
      await user.click(button); expect(screen.getByRole('alert')).toHaveTextContent('iguales');
      await user.type(screen.getByLabelText('Confirmar contraseña'), '123');
    }
    await user.click(button);
    expect(await screen.findByRole('status')).toHaveTextContent('exitoso');
    expect(fetch).toHaveBeenCalledWith(`http://localhost:5000/api/auth/${register ? 'register' : 'login'}`, expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: '123123' }) }));
    await user.click(screen.getByRole('link', { name: 'Profile', exact: true }));
    expect(await screen.findByText('Email: test@example.com')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/me', expect.objectContaining({ headers: { Authorization: 'Bearer test-jwt' } }));
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });
}

test('perfil protegido y logout del navbar', async () => {
  const user = start('/profile');
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  await login(user);
  await user.click(screen.getByRole('button', { name: 'Logout', exact: true }));
  expect(screen.getByRole('link', { name: 'INGRESA' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Profile', exact: true })).not.toBeInTheDocument();
});

test('checkout rechaza sin vaciar; reintento exitoso envía carrito y JWT', async () => {
  const user = start();
  await user.click((await screen.findAllByRole('button', { name: /Añadir al Carrito/ }))[0]);
  await login(user); await user.click(screen.getByRole('link', { name: /Total:/ }));
  checkoutError = true; await user.click(screen.getByRole('button', { name: 'Pagar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Compra rechazada');
  expect(screen.getByRole('heading', { name: 'Total: $5.950' })).toBeInTheDocument();
  checkoutError = false; await user.click(screen.getByRole('button', { name: 'Pagar' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Compra realizada con éxito');
  const [, options] = fetch.mock.calls.find(([url]) => url.endsWith('/checkouts'));
  expect(options.headers.Authorization).toBe('Bearer test-jwt');
  expect(JSON.parse(options.body).cart[0]).toMatchObject({ id: 'p001', count: 1 });
  expect(screen.getByRole('heading', { name: 'Total: $0' })).toBeInTheDocument();
});

test('credenciales inválidas muestran error sin iniciar sesión', async () => {
  authError = true;
  const user = start('/login');
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Contraseña', { exact: true }), '123123');
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  expect(screen.queryByRole('link', { name: 'Profile', exact: true })).not.toBeInTheDocument();
});

test('sesión vencida en perfil vuelve a login', async () => {
  const user = start(); await login(user); expired = true;
  await user.click(screen.getByRole('link', { name: 'Profile', exact: true }));
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
});

test('404 vuelve a inicio y muestra errores de conexión', async () => {
  const user = start('/ruta-inexistente');
  expect(screen.getByRole('heading', { name: /404/ })).toBeInTheDocument();
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  await user.click(screen.getByRole('link', { name: 'Volver al inicio' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar'));
});
