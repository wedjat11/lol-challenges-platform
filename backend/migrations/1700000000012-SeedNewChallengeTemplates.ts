import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reemplaza los 6 templates legacy por los 20 nuevos retos.
 * Los templates legacy se desactivan (is_active = false) para preservar
 * la integridad referencial con challenges existentes.
 */
export class SeedNewChallengeTemplates1700000000012 implements MigrationInterface {
  name = 'SeedNewChallengeTemplates1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Deactivate legacy templates
    await queryRunner.query(`
      UPDATE challenge_templates
      SET is_active = false
      WHERE validator_key IN (
        'wins_any_champion',
        'wins_with_champion',
        'assists_accumulated',
        'assists_single_game',
        'kills_accumulated',
        'kills_single_game'
      );
    `);

    // Insert 20 new templates
    await queryRunner.query(`
      INSERT INTO challenge_templates (name, description, validator_key, param_schema, reward_formula) VALUES

      -- ===== BLOQUE 1: SUPERVIVENCIA EXTREMA =====
      (
        'Inmortal',
        'Gana $games$ partidas terminando con 0 muertes. Solo cuentan partidas ganadas donde deaths == 0.',
        'immortal',
        '{"type":"object","properties":{"games":{"type":"integer","minimum":1,"maximum":10,"description":"Partidas ganadas sin morir requeridas"}},"required":["games"]}',
        'games * 3'
      ),
      (
        'Racha de Invicto',
        'Logra una racha activa de $games$ partidas consecutivas sin morir. La racha se mide desde tu partida más reciente hacia atrás.',
        'deathless_streak',
        '{"type":"object","properties":{"games":{"type":"integer","minimum":2,"maximum":10,"description":"Longitud de la racha sin morir requerida"}},"required":["games"]}',
        'games * 4'
      ),
      (
        'Escapista',
        'Termina $games$ partidas teniendo como máximo $max_deaths$ muertes en cada una.',
        'escapist',
        '{"type":"object","properties":{"games":{"type":"integer","minimum":3,"maximum":15,"description":"Número de partidas requeridas"},"max_deaths":{"type":"integer","minimum":1,"maximum":5,"description":"Máximo de muertes permitidas por partida"}},"required":["games","max_deaths"]}',
        'games * 2'
      ),
      (
        'Intocable',
        'Logra $kills$ asesinatos en una sola partida terminando con 0 muertes.',
        'untouchable',
        '{"type":"object","properties":{"kills":{"type":"integer","minimum":5,"maximum":20,"description":"Kills mínimos requeridos con 0 muertes"}},"required":["kills"]}',
        'kills * 2'
      ),
      (
        'Guardián de la Vida',
        'Mantén un promedio de muertes menor a $max_avg_deaths$ en tus últimas 15 partidas válidas. Requiere mínimo 5 partidas.',
        'life_guardian',
        '{"type":"object","properties":{"max_avg_deaths":{"type":"number","minimum":1.0,"maximum":5.0,"description":"Promedio máximo de muertes permitido"}},"required":["max_avg_deaths"]}',
        '10'
      ),

      -- ===== BLOQUE 2: COMBATE Y AGRESIVIDAD =====
      (
        'Asesino Serial',
        'Acumula un total de $kills$ kills en todas tus partidas válidas del reto.',
        'serial_killer',
        '{"type":"object","properties":{"kills":{"type":"integer","minimum":20,"maximum":300,"description":"Total de kills a acumular"}},"required":["kills"]}',
        'kills / 15'
      ),
      (
        'Maestro de Multikills',
        'Consigue al menos una multikill del tipo indicado ($multikill_type$) en $games$ partidas distintas.',
        'multikill_master',
        '{"type":"object","properties":{"games":{"type":"integer","minimum":1,"maximum":10,"description":"Número de partidas con la multikill requerida"},"multikill_type":{"type":"string","enum":["double","triple","quadra","penta"],"description":"Tipo de multikill requerido"}},"required":["games","multikill_type"]}',
        'games * 3'
      ),
      (
        'Daño Explosivo',
        'Inflige más de $damage$ de daño a campeones (totalDamageDealtToChampions) en una sola partida.',
        'explosive_damage',
        '{"type":"object","properties":{"damage":{"type":"integer","minimum":15000,"maximum":100000,"description":"Daño mínimo a infligir en una partida"}},"required":["damage"]}',
        'damage / 5000'
      ),
      (
        'First Blood King',
        'Consigue la Primera Sangre (firstBloodKill) en $games$ partidas.',
        'first_blood_king',
        '{"type":"object","properties":{"games":{"type":"integer","minimum":1,"maximum":10,"description":"Partidas con First Blood requeridas"}},"required":["games"]}',
        'games * 3'
      ),
      (
        'Dominación',
        'Logra un KDA ratio superior a $kda$ en una partida ganada. KDA = (kills + assists) / max(deaths, 1).',
        'domination',
        '{"type":"object","properties":{"kda":{"type":"number","minimum":2.0,"maximum":15.0,"description":"KDA mínimo requerido en una victoria"}},"required":["kda"]}',
        'kda * 2'
      ),

      -- ===== BLOQUE 3: MACROGAME Y ECONOMÍA =====
      (
        'Amo del Farm',
        'Logra un promedio de $cs_per_min$ súbditos por minuto en una sola partida. CS/min = (totalMinionsKilled + neutralMinionsKilled) / (gameDuration / 60).',
        'farm_master',
        '{"type":"object","properties":{"cs_per_min":{"type":"number","minimum":5.0,"maximum":12.0,"description":"CS por minuto mínimo requerido en una partida"}},"required":["cs_per_min"]}',
        'cs_per_min * 2'
      ),
      (
        'Magnate de Oro',
        'Acumula un total de $gold$ de oro (goldEarned) entre todas las partidas válidas del reto.',
        'gold_tycoon',
        '{"type":"object","properties":{"gold":{"type":"integer","minimum":50000,"maximum":500000,"description":"Total de oro a acumular"}},"required":["gold"]}',
        'gold / 25000'
      ),
      (
        'Demoledor de Torres',
        'Destruye o asiste en la destrucción de $towers$ torretas en total (turretTakedowns o turretKills).',
        'tower_demolisher',
        '{"type":"object","properties":{"towers":{"type":"integer","minimum":5,"maximum":60,"description":"Total de torretas a destruir/asistir"}},"required":["towers"]}',
        'towers'
      ),
      (
        'Cazador Épico',
        'Participa en la muerte de $monsters$ monstruos épicos (Dragones, Barones y Heraldos) en total.',
        'epic_hunter',
        '{"type":"object","properties":{"monsters":{"type":"integer","minimum":3,"maximum":50,"description":"Total de monstruos épicos a cazar"}},"required":["monsters"]}',
        'monsters'
      ),
      (
        'Invasor',
        'Roba $camps$ campamentos de la jungla enemiga en total (enemyJungleMonsterKills).',
        'invader',
        '{"type":"object","properties":{"camps":{"type":"integer","minimum":5,"maximum":100,"description":"Total de campamentos enemigos a robar"}},"required":["camps"]}',
        'camps * 2'
      ),

      -- ===== BLOQUE 4: DESEMPEÑO Y UTILIDAD =====
      (
        'Kill Participation %',
        'Logra una participación en asesinatos superior al $percentage$% en una sola partida. KP = (kills + assists) / total kills del equipo.',
        'kill_participation',
        '{"type":"object","properties":{"percentage":{"type":"integer","minimum":50,"maximum":100,"description":"Porcentaje mínimo de Kill Participation requerido"}},"required":["percentage"]}',
        'percentage / 10'
      ),
      (
        'Visionario',
        'Logra una puntuación de visión (visionScore) superior a $vision_score$ en $games$ partidas.',
        'visionary',
        '{"type":"object","properties":{"vision_score":{"type":"integer","minimum":20,"maximum":100,"description":"Vision Score mínimo por partida"},"games":{"type":"integer","minimum":1,"maximum":10,"description":"Número de partidas requeridas"}},"required":["vision_score","games"]}',
        'games * 2'
      ),
      (
        'Racha Ganadora',
        'Gana $games$ partidas consecutivas desde la fecha de aceptación del reto. La racha activa se mide desde la partida más reciente.',
        'winning_streak',
        '{"type":"object","properties":{"games":{"type":"integer","minimum":2,"maximum":10,"description":"Longitud de la racha ganadora requerida"}},"required":["games"]}',
        'games * 3'
      ),
      (
        'Soporte de Élite',
        'Logra un total de $assists$ asistencias acumuladas en todas tus partidas válidas del reto.',
        'elite_support',
        '{"type":"object","properties":{"assists":{"type":"integer","minimum":20,"maximum":300,"description":"Total de asistencias a acumular"}},"required":["assists"]}',
        'assists / 15'
      ),
      (
        'Tanque Absoluto',
        'Mitiga un total de $damage$ de daño (damageSelfMitigated) en una sola partida.',
        'absolute_tank',
        '{"type":"object","properties":{"damage":{"type":"integer","minimum":10000,"maximum":200000,"description":"Daño a mitigar en una sola partida"}},"required":["damage"]}',
        'damage / 10000'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove new templates
    await queryRunner.query(`
      DELETE FROM challenge_templates
      WHERE validator_key IN (
        'immortal', 'deathless_streak', 'escapist', 'untouchable', 'life_guardian',
        'serial_killer', 'multikill_master', 'explosive_damage', 'first_blood_king', 'domination',
        'farm_master', 'gold_tycoon', 'tower_demolisher', 'epic_hunter', 'invader',
        'kill_participation', 'visionary', 'winning_streak', 'elite_support', 'absolute_tank'
      );
    `);

    // Reactivate legacy templates
    await queryRunner.query(`
      UPDATE challenge_templates
      SET is_active = true
      WHERE validator_key IN (
        'wins_any_champion',
        'wins_with_champion',
        'assists_accumulated',
        'assists_single_game',
        'kills_accumulated',
        'kills_single_game'
      );
    `);
  }
}
