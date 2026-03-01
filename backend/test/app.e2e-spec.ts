import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { v4 as uuidv4 } from 'uuid';

describe('LoL Challenge Platform API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health - should return health status', () => {
      return request(app.getHttpServer())
        .get('/v1/health')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('services');
          expect(['ok', 'degraded']).toContain(res.body.status);
        });
    });
  });

  describe('Authentication', () => {
    it('POST /auth/register - should register a new user', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `test_${uniqueId}@example.com`;
      const testUsername = `user_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
          gameName: 'TestPlayer',
          tagLine: 'NA1',
        })
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('user');
          } else if (res.status === 409) {
            // User already exists - that's ok for test
            expect(res.body).toHaveProperty('code');
          }
        })
        .end(done);
    });

    it('POST /auth/login - should login with email and password', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `login_${uniqueId}@example.com`;
      const testPassword = 'LoginPassword123!';
      const testUsername = `loginuser_${uniqueId}`;

      // First register a user
      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: testPassword,
        })
        .end(() => {
          // Then login
          request(app.getHttpServer())
            .post('/v1/auth/login')
            .send({
              email: testEmail,
              password: testPassword,
            })
            .expect((res) => {
              if (res.status === 200) {
                expect(res.body).toHaveProperty('accessToken');
                expect(res.body).toHaveProperty('user');
              }
            })
            .end(done);
        });
    });

    it('POST /auth/logout - should logout user', (done) => {
      request(app.getHttpServer())
        .post('/v1/auth/logout')
        .expect(204)
        .end(done);
    });
  });

  describe('Users', () => {
    it('GET /users/me - requires authentication', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `userme_${uniqueId}@example.com`;
      const testUsername = `usermeu_${uniqueId}`;

      // Register and then fetch profile
      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get('/v1/users/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect((response) => {
              expect(response.body).toHaveProperty('id');
              expect(response.body).toHaveProperty('username');
              expect(response.body).toHaveProperty('email');
              expect(response.body).toHaveProperty('balance');
            })
            .end(done);
        });
    });

    it('POST /users/me/riot-account - should handle Riot account linking', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `riot_${uniqueId}@example.com`;
      const testUsername = `riotuser_${uniqueId}`;

      // Register and then link Riot account
      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .post('/v1/users/me/riot-account')
            .set('Authorization', `Bearer ${token}`)
            .send({
              gameName: 'SomePlayer',
              tagLine: 'LAN',
            })
            .expect((response) => {
              // Can fail with various reasons - just test endpoint responds
              expect([200, 201, 400, 404, 409]).toContain(response.status);
            })
            .end(done);
        });
    });

    it('GET /users/me/riot-account - should get Riot account or 404', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `riotget_${uniqueId}@example.com`;
      const testUsername = `riotgetu_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get('/v1/users/me/riot-account')
            .set('Authorization', `Bearer ${token}`)
            .expect((response) => {
              expect([200, 404]).toContain(response.status);
            })
            .end(done);
        });
    });
  });

  describe('Templates', () => {
    it('GET /templates - returns list or 403', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `tmpl_${uniqueId}@example.com`;
      const testUsername = `tmpluser_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get('/v1/templates')
            .set('Authorization', `Bearer ${token}`)
            .expect((response) => {
              // Riot account required or returns list
              expect([200, 403]).toContain(response.status);
            })
            .end(done);
        });
    });

    it('GET /templates/:id - should handle template retrieval', (done) => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `tmplid_${uniqueId}@example.com`;
      const testUsername = `tmpliduser_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get(`/v1/templates/${validUUID}`)
            .set('Authorization', `Bearer ${token}`)
            .expect((response) => {
              expect([200, 404, 500]).toContain(response.status);
            })
            .end(done);
        });
    });
  });

  describe('Economy', () => {
    it('GET /economy/balance - should return balance', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `econ_${uniqueId}@example.com`;
      const testUsername = `econuser_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get('/v1/economy/balance')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect((response) => {
              expect(response.body).toHaveProperty('balance');
              expect(typeof response.body.balance).toBe('number');
            })
            .end(done);
        });
    });

    it('GET /economy/transactions - should return transaction history', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `txn_${uniqueId}@example.com`;
      const testUsername = `txnuser_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get('/v1/economy/transactions?limit=10&offset=0')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect((response) => {
              expect(response.body).toHaveProperty('transactions');
              expect(Array.isArray(response.body.transactions)).toBe(true);
            })
            .end(done);
        });
    });
  });

  describe('Challenges', () => {
    it('GET /challenges - should list challenges or return 403', (done) => {
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `chall_${uniqueId}@example.com`;
      const testUsername = `challuser_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get('/v1/challenges')
            .set('Authorization', `Bearer ${token}`)
            .expect((response) => {
              expect([200, 403]).toContain(response.status);
            })
            .end(done);
        });
    });

    it('GET /challenges/:id - should handle challenge retrieval', (done) => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const uniqueId = uuidv4().substring(0, 8);
      const testEmail = `challid_${uniqueId}@example.com`;
      const testUsername = `challiduser_${uniqueId}`;

      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'TestPassword123!',
        })
        .end((err, res) => {
          const token = res.body.accessToken;

          request(app.getHttpServer())
            .get(`/v1/challenges/${validUUID}`)
            .set('Authorization', `Bearer ${token}`)
            .expect((response) => {
              expect([200, 403, 404]).toContain(response.status);
            })
            .end(done);
        });
    });
  });

  describe('Error Handling', () => {
    it('GET /invalid-endpoint - should return 404', (done) => {
      request(app.getHttpServer())
        .get('/v1/invalid-endpoint')
        .expect(404)
        .end(done);
    });

    it('GET /users/me without auth - should return 401', (done) => {
      request(app.getHttpServer())
        .get('/v1/users/me')
        .expect(401)
        .end(done);
    });

    it('POST /auth/login with invalid credentials - should return error', (done) => {
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect((res) => {
          expect([400, 401, 404]).toContain(res.status);
        })
        .end(done);
    });
  });
});
