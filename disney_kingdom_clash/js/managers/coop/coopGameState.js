export const coopGameState = {
    p1_mana: 100,
    p2_mana: 100,
    hp: 20,
    initial_hp: 20,
    wave: 0,
    totalWaves: 10,
    enemySpawnTimer: 5,
    p1_summonCount: 0,
    p2_summonCount: 0,
    isPaused: false,
    gameEnded: false,
};

export function init() {
    Object.assign(coopGameState, {
        p1_mana: 100,
        p2_mana: 100,
        hp: 20,
        wave: 0,
        enemySpawnTimer: 5.0,
        p1_summonCount: 0,
        p2_summonCount: 0,
        isPaused: false,
        gameEnded: false,
    });
}

