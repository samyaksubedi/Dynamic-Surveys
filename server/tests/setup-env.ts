process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://dynamic_surveys:dynamic_surveys_dev@localhost:5434/dynamic_surveys_test?schema=public";
process.env.REDIS_URL ??= "redis://:dynamic_surveys_redis_dev@localhost:6380";
process.env.ACCESS_TOKEN_SECRET ??=
  "test-access-token-secret-with-at-least-32-characters";
process.env.EMAIL_DELIVERY_ENABLED = "false";
process.env.SUBMISSION_RATE_LIMIT_MAX ??= "10";
