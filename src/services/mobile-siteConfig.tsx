// Site configuration constants
export const mobile_siteConfig = {
 
  IS_LOGIN: 'is_login',
  UID: 'user_id',
  SLUG: 'user_slug',
  EMAIL: 'user_email',
  BASE_URL: 'https://sooprs.com/api/',
  BASE_URL2: 'https://sooprs.com/api2/public/index.php/',
  MOB_ACCESS_TOKEN_KEY: "token",
  INDEX: 'api2/public/index.php/',




  REGISTER_USER_NEW: 'auth/vendor-register', // Update with your actual endpoint
  VERIFY_OTP_NEW: 'auth/verify-otp-user', // Update with your actual endpoint
  COMPLETE_PROFILE: 'user/vendor/complete-vendor-profile', // Update with your actual endpoint
  VERIFY_ORDER:"update_wallet",
  // TOKEN: 'auth_token',

  GET_ALL_CATEGORIES: 'auth/get-all-categories',

  GET_MEMBERSHIP:"get-membership-plans",
  CREATE_RAZORPAY_ORDER:"https://sooprs.com/create_razr_order.php",

  GET_USER_DETAILS:"user/vendor/get-vendor-profile",
  GET_PACKAGES:"user/vendor/all-vendor-packages",
  GET_PACKAGE_DETAILS:"user/vendor/package-by-slug/",
  CREATE_PACKAGE:"user/vendor/create-vendor-package",
  UPDATE_PACKAGE:"user/vendor/update-vendor-package",
  FILTER_LEADS_ALL:"filter-leads-all-new",
  GET_CONTACT_LIST:"get-contact-list",
   GET_ALL_ORDERS:"user/vendor/all-orders",
  GET_ORDER_DETAILS:"user/vendor/orders-detail-by-order_id/",
  SHOW_LEAD_MOBILE:"show-lead-mobile"

};

