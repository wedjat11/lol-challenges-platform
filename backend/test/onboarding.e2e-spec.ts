/**
 * E2E — Flujo de onboarding y actualización de username
 *
 * Cubre:
 * 1. Flujo completo normal: registro → check disponibilidad → actualizar username
 * 2. Caso del bug corregido: después de actualizar username, GET /users/me
 *    debe devolver el NUEVO nombre, no el auto-generado original
 * 3. Validaciones del endpoint PATCH /users/me/username
 * 4. Endpoint GET /users/check-username (disponibilidad)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { v4 as uuidv4 } from 'uuid';

// Helpers ─────────────────────────────────────────────────────────────────────

function uid(): string {
  return uuidv4().replace(/-/g, '').substring(0, 8);
}

/**
 * Registra un usuario con un nombre auto-generado (simula lo que hace clerkSync)
 * y devuelve el accessToken + el userId.
 */
async function registerUser(
  app: INestApplication,
): Promise<{ token: string; userId: string; autoUsername: string }> {
  const id = uid();
  const autoUsername = `user_${id}`;
  const res = await request(app.getHttpServer())
    .post('/v1/auth/register')
    .send({
      username: autoUsername,
      email: `${id}@example.com`,
      password: 'TestPass123!',
    })
    .expect(201);

  return {
    token: res.body.accessToken as string,
    userId: res.body.user.id as string,
    autoUsername,
  };
}

// Tests ───────────────────────────────────────────────────────────────────────

describe('Onboarding — flujo completo (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── 1. Flujo normal ────────────────────────────────────────────────────────
  describe('Flujo normal de onboarding', () => {
    it('nuevo usuario: nombre auto-generado aparece en GET /users/me', async () => {
      const { token, autoUsername } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.username).toBe(autoUsername);
    });

    it('check-username: nombre disponible retorna available:true', async () => {
      const { token } = await registerUser(app);
      const newName = `Shadow_${uid()}`;

      const res = await request(app.getHttpServer())
        .get(`/v1/users/check-username?username=${newName}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ available: true });
    });

    it('PATCH /users/me/username: actualiza el nombre exitosamente', async () => {
      const { token } = await registerUser(app);
      const newName = `prueb_war_${uid()}`;

      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: newName })
        .expect(200);
    });
  });

  // ── 2. Caso del bug: GET /users/me debe reflejar el nuevo nombre ───────────
  describe('Corrección de bug: username actualizado visible en GET /users/me', () => {
    it('después de actualizar username, GET /users/me devuelve el NUEVO nombre', async () => {
      const { token, autoUsername } = await registerUser(app);
      const newName = `prueb_war_${uid()}`;

      // Confirmar que empieza con el nombre auto-generado
      const before = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(before.body.username).toBe(autoUsername);

      // Actualizar nombre
      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: newName })
        .expect(200);

      // Verificar que GET /users/me refleja el cambio inmediatamente
      const after = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(after.body.username).toBe(newName);
      expect(after.body.username).not.toBe(autoUsername);
    });

    it('usuario puede mantener su propio nombre sin conflicto (re-envío del mismo)', async () => {
      const { token, autoUsername } = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: autoUsername })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.username).toBe(autoUsername);
    });
  });

  // ── 3. Validaciones de PATCH /users/me/username ───────────────────────────
  describe('PATCH /users/me/username — validaciones', () => {
    it('retorna 401 sin token de autenticación', async () => {
      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .send({ username: 'nuevo_nombre' })
        .expect(401);
    });

    it('retorna 400 cuando el nombre es demasiado corto (< 3 chars)', async () => {
      const { token } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'ab' })
        .expect(400);

      expect(res.body.code).toBe('INVALID_USERNAME');
    });

    it('retorna 400 cuando el nombre tiene caracteres especiales (espacios)', async () => {
      const { token } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'nombre malo' })
        .expect(400);

      expect(res.body.code).toBe('INVALID_USERNAME');
    });

    it('retorna 400 cuando el nombre tiene caracteres especiales (guión)', async () => {
      const { token } = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'nombre-malo' })
        .expect(400);
    });

    it('retorna 400 cuando el nombre supera los 20 caracteres', async () => {
      const { token } = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'a'.repeat(21) })
        .expect(400);
    });

    it('retorna 409 cuando el nombre ya lo tiene otro usuario', async () => {
      const { token: token1, autoUsername: user1Name } = await registerUser(app);
      const { token: token2 } = await registerUser(app);

      // Segundo usuario intenta tomar el nombre del primero
      const res = await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token2}`)
        .send({ username: user1Name })
        .expect(409);

      expect(res.body.code).toBe('USERNAME_EXISTS');
    });

    it('acepta nombres con letras mayúsculas, minúsculas, números y guiones bajos', async () => {
      const { token } = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'Shadow_King99' })
        .expect(200);
    });
  });

  // ── 4. GET /users/check-username — disponibilidad ─────────────────────────
  describe('GET /users/check-username', () => {
    it('retorna available:true para un nombre libre', async () => {
      const { token } = await registerUser(app);
      const freeName = `libre_${uid()}`;

      const res = await request(app.getHttpServer())
        .get(`/v1/users/check-username?username=${freeName}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ available: true });
    });

    it('retorna available:false cuando el nombre ya pertenece a otro usuario', async () => {
      const { token: token2 } = await registerUser(app);
      const { autoUsername: takenName } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .get(`/v1/users/check-username?username=${takenName}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(res.body).toEqual({ available: false });
    });

    it('retorna available:true para el propio nombre del usuario autenticado', async () => {
      const { token, autoUsername } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .get(`/v1/users/check-username?username=${autoUsername}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ available: true });
    });

    it('retorna available:false para formato inválido (muy corto)', async () => {
      const { token } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .get('/v1/users/check-username?username=ab')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ available: false });
    });

    it('retorna 401 sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/v1/users/check-username?username=alguien')
        .expect(401);
    });
  });

  // ── 5. Flujo completo de onboarding de principio a fin ────────────────────
  describe('Flujo de onboarding end-to-end completo', () => {
    it('simula el flujo completo: registro → check → actualizar → verificar', async () => {
      // Paso 1: Usuario nuevo (clerkSync crea uno con nombre auto-generado)
      const { token, autoUsername } = await registerUser(app);
      const chosenName = `guerrero_${uid()}`;

      // Paso 2: Verificar que el nombre está disponible
      const checkRes = await request(app.getHttpServer())
        .get(`/v1/users/check-username?username=${chosenName}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(checkRes.body.available).toBe(true);

      // Paso 3: Actualizar el username
      await request(app.getHttpServer())
        .patch('/v1/users/me/username')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: chosenName })
        .expect(200);

      // Paso 4 (el bug corregido): GET /users/me debe devolver el nombre elegido
      const profile = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profile.body.username).toBe(chosenName);
      expect(profile.body.username).not.toBe(autoUsername);
      expect(profile.body).toHaveProperty('balance');
      expect(profile.body).toHaveProperty('hasRiotAccount');

      // Paso 5: El nombre anterior ya no está disponible para otro usuario
      const { token: token2 } = await registerUser(app);
      const takenCheck = await request(app.getHttpServer())
        .get(`/v1/users/check-username?username=${chosenName}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);
      expect(takenCheck.body.available).toBe(false);
    });
  });
});
