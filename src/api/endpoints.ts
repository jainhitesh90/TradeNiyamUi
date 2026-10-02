export const endpoints = {
  login: '/auth/login',
  signUp: '/auth/sign-up',
  user: '/user',
  brokerMapping: '/user/map-broker-to-user',
  markBrokerAsConnected: '/user/connect-broker',
  markBrokerAsDisconnected: '/user/disconnect-broker',
  balance: '/user/balance',
  position: '/user/position',
  orders: '/user/orders',
  rules: '/rules',
  brokers: '/brokers',
  fnoKillSwitch: '/trading/fno_kill_switch',
} as const;
