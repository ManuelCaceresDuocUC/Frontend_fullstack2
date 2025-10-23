import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/perfumes', () =>
    HttpResponse.json([{ id: '1', nombre: 'Club de Nuit', ml: 10, precio: 8990, disponible: true }])
  )
];