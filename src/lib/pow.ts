import { createHash } from "crypto";

export function difficultyForReward(rewardSparks: number): number {
  return Math.max(8, Math.min(24, Math.floor(rewardSparks / 10)));
}

export function verifyPow(nonce: string, missionId: string, userPubkey: string, difficulty: number): boolean {
  const input = `${nonce}:${missionId}:${userPubkey}`;
  const hash = createHash("sha256").update(input).digest();
  let bits = 0;
  for (const byte of hash) {
    if (byte === 0) { bits += 8; }
    else { bits += Math.clz32(byte) - 24; break; }
  }
  return bits >= difficulty;
}
