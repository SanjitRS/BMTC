export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'gurugale-dementia-care-secret-key-2026',
  jwtExpiresIn: '1d',
  refreshTokenExpiresIn: '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
