const ROUTE_PATHS = {
  ONBOARDING: '/',
  HOME: '/home',
  LOGIN: '/login',
  SIGNUP: '/signup',
  MYPAGE: '/mypage',
  RESULT: '/result',
  PLAYER_SPINNER: '/player/spinner',
  PLAYER_RAIN: '/player/rain',
} as const;

export const ROUTES = {
  ...ROUTE_PATHS,
  onboarding: ROUTE_PATHS.ONBOARDING,
  home: ROUTE_PATHS.HOME,
  login: ROUTE_PATHS.LOGIN,
  signup: ROUTE_PATHS.SIGNUP,
  mypage: ROUTE_PATHS.MYPAGE,
  result: ROUTE_PATHS.RESULT,
  playerSpinner: ROUTE_PATHS.PLAYER_SPINNER,
  playerRain: ROUTE_PATHS.PLAYER_RAIN,
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
