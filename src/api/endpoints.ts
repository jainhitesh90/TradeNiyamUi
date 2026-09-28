export const endpoints = {
  login: '/auth/login',
  signUp: '/auth/sign-up',
  user: '/user',
  balance: '/user/balance',
  position: '/user/position',
  brokers: '/brokers',
  brokerMapping: '/groww/map-broker-to-user',
  markBrokerAsConnected: '/groww/mark-as-connected',
  markBrokerAsDisconnected: '/groww/mark-as-disconnected',
  orders: '/user/orders',
} as const;
