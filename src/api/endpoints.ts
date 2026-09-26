export const endpoints = {
  login: '/auth/login',
  signUp: '/auth/sign-up',
  user: '/user',
  balance: '/user/balance',
  brokers: '/brokers',
  brokerMapping: '/groww/map-broker-to-user',
  markBrokerAsConnected: '/groww/mark-as-connected',
  orders: '/orders',
} as const;
