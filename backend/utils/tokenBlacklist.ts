const revokedTokens = new Map<string, number>();

function removeExpiredTokens(now = Date.now()) {
  for (const [tokenId, expiresAt] of revokedTokens) {
    if (expiresAt <= now) revokedTokens.delete(tokenId);
  }
}

export function revokeToken(tokenId: string, expiresAt: number) {
  removeExpiredTokens();
  revokedTokens.set(tokenId, expiresAt);
}

export function isTokenRevoked(tokenId: string) {
  removeExpiredTokens();
  return revokedTokens.has(tokenId);
}
