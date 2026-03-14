import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed de retos de prueba — uno por cada uno de los 20 templates.
 *
 * Objetivo: verificar que el validation-worker procesa correctamente cada tipo
 * de reto con parámetros mínimos (todo = 1) y fecha de aceptación de ayer a
 * las 10:00 AM UTC, para que la lógica de filtrado por accepted_at funcione
 * con partidas reales.
 *
 * Requisitos previos:
 *   - Al menos DOS usuarios activos en la DB.
 *   - El usuario TARGET debe tener una riot_account vinculada.
 *   - Los 20 templates de 1700000000012 deben estar aplicados.
 *
 * Nota sobre life_guardian:
 *   El validador requiere MÍNIMO 5 partidas en la ventana para calcular el
 *   promedio. Con max_avg_deaths:99 pasará trivialmente una vez que el target
 *   juegue ≥5 partidas desde la accepted_at.
 *
 * Nota sobre deathless_streak / winning_streak con games:1:
 *   Bypassean el minimum:2 del param_schema porque esta migración inserta
 *   directamente en la DB. Los validadores solo leen el valor crudo del campo.
 */
export class SeedTestChallenges1700000000014 implements MigrationInterface {
  name = 'SeedTestChallenges1700000000014';

  // accepted_at: ayer 2026-03-03 a las 10:00 AM UTC
  private readonly ACCEPTED_AT = '2026-03-03 10:00:00+00';
  // expires_at: accepted_at + 7 días
  private readonly EXPIRES_AT = '2026-03-10 10:00:00+00';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Buscar el TARGET: primer usuario activo con cuenta Riot vinculada ──
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const targetRows: Array<{ target_id: string }> = await queryRunner.query(`
      SELECT u.id AS target_id
      FROM users u
      INNER JOIN riot_accounts ra ON ra.user_id = u.id
      WHERE u.is_active = true
      ORDER BY u.created_at ASC
      LIMIT 1
    `);

    if (!targetRows || targetRows.length === 0) {
      throw new Error(
        'SeedTestChallenges: No se encontró ningún usuario con cuenta Riot vinculada. ' +
          'Vincula una cuenta Riot antes de ejecutar esta migración.',
      );
    }

    const targetId = targetRows[0].target_id;

    // ── 2. Buscar el CREATOR: cualquier otro usuario activo ──
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const creatorRows: Array<{ creator_id: string }> = await queryRunner.query(
      `SELECT id AS creator_id
       FROM users
       WHERE id != $1
         AND is_active = true
       ORDER BY created_at ASC
       LIMIT 1`,
      [targetId],
    );

    if (!creatorRows || creatorRows.length === 0) {
      throw new Error(
        'SeedTestChallenges: Se necesitan al menos 2 usuarios activos para crear retos de prueba. ' +
          'Crea otra cuenta de usuario primero.',
      );
    }

    const creatorId = creatorRows[0].creator_id;

    // ── 3. Insertar 20 retos de prueba, uno por template ──
    //
    // Parámetros mínimos por validator:
    //   immortal          → games:1        (gana 1 partida con 0 muertes)
    //   deathless_streak  → games:1        (1 partida consecutiva sin morir)
    //   escapist          → games:1, max_deaths:99  (1 partida, hasta 99 muertes = cualquiera)
    //   untouchable       → kills:1        (1 kill con 0 muertes en una partida)
    //   life_guardian     → max_avg_deaths:99.0  (promedio < 99 — trivial, pero necesita ≥5 partidas)
    //   serial_killer     → kills:1        (acumula 1 kill total)
    //   multikill_master  → games:1, multikill_type:"double"  (1 doble kill en cualquier partida)
    //   explosive_damage  → damage:1       (más de 1 de daño en una partida)
    //   first_blood_king  → games:1        (primera sangre en 1 partida)
    //   domination        → kda:0.1        (KDA > 0.1 en una victoria — cualquier victoria)
    //   farm_master       → cs_per_min:0.1 (0.1 CS/min — básicamente cualquier partida)
    //   gold_tycoon       → gold:1         (acumula 1 de oro total)
    //   tower_demolisher  → towers:1       (1 torreta demolida/asistida en total)
    //   epic_hunter       → monsters:1     (1 monstruo épico en total)
    //   invader           → camps:1        (1 campamento enemigo robado en total)
    //   kill_participation→ percentage:1   (KP > 1% en una partida — trivial)
    //   visionary         → vision_score:1, games:1  (visión > 1 en 1 partida)
    //   winning_streak    → games:1        (1 victoria consecutiva)
    //   elite_support     → assists:1      (acumula 1 asistencia total)
    //   absolute_tank     → damage:1       (mitiga 1 de daño en una partida)

    await queryRunner.query(
      `INSERT INTO challenges
         (creator_id, target_id, template_id, params, status,
          reward_amount, accepted_at, expires_at, duration_days)
       SELECT
         $1::uuid,
         $2::uuid,
         ct.id,
         v.test_params::jsonb,
         'ACTIVE'::challenge_status,
         1,
         '${this.ACCEPTED_AT}'::timestamptz,
         '${this.EXPIRES_AT}'::timestamptz,
         7
       FROM (VALUES
         ('immortal',            '{"games":1}'),
         ('deathless_streak',    '{"games":1}'),
         ('escapist',            '{"games":1,"max_deaths":99}'),
         ('untouchable',         '{"kills":1}'),
         ('life_guardian',       '{"max_avg_deaths":99.0}'),
         ('serial_killer',       '{"kills":1}'),
         ('multikill_master',    '{"games":1,"multikill_type":"double"}'),
         ('explosive_damage',    '{"damage":1}'),
         ('first_blood_king',    '{"games":1}'),
         ('domination',          '{"kda":0.1}'),
         ('farm_master',         '{"cs_per_min":0.1}'),
         ('gold_tycoon',         '{"gold":1}'),
         ('tower_demolisher',    '{"towers":1}'),
         ('epic_hunter',         '{"monsters":1}'),
         ('invader',             '{"camps":1}'),
         ('kill_participation',  '{"percentage":1}'),
         ('visionary',           '{"vision_score":1,"games":1}'),
         ('winning_streak',      '{"games":1}'),
         ('elite_support',       '{"assists":1}'),
         ('absolute_tank',       '{"damage":1}')
       ) AS v(validator_key, test_params)
       JOIN challenge_templates ct
         ON ct.validator_key = v.validator_key
        AND ct.is_active = true`,
      [creatorId, targetId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Elimina solo los retos de prueba identificados por su accepted_at y parámetros
    await queryRunner.query(`
      DELETE FROM challenges
      WHERE accepted_at = '${this.ACCEPTED_AT}'::timestamptz
        AND status      = 'ACTIVE'
        AND reward_amount = 1
        AND duration_days = 7
    `);
  }
}
