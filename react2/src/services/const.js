const API = {
  SOFTWARE: {
    GET: {
      ALL: "/api/software",
      BY_ID: "/api/software/:id",
    },
    POST: {
      ALL: "/api/software",
    },
    PUT: {
      BY_ID: "/api/software/:id",
    },
    DELETE: {
      BY_ID: "/api/software/:id",
    },
  },
  LICENSE: {
    GET: {
      ALL: "/api/licenses",
      BY_ID: "/api/licenses/:id",
      AVAILABLE_ALL: "/api/licenses/available/all",
      AVAILABLE_BY_ID: "/licenses/available",
    },
    POST: {
      ALL: "/api/licenses",
      MULTIPLE: "/api/licenses-bulk",
      MULTIPLE_DELETE: "/api/licenses/delete-multiple",
    },
    PUT: {
      BY_ID: "/api/licenses/:id",
      MULTIPLE: "/api/licenses-bulk",
    },
    DELETE: {
      BY_ID: "/api/licenses/:id",
    },
  },
  SOFTWARE_VERSION: {
    GET: {
      ALL: "/api/software-versions",
      BY_ID: "/api/software-versions/:id",
      BY_SOFTWARE_ID: "/api/software-versions/:software_id/versions",
    },
    POST: {
      ALL: "/api/software-versions",
    },
    PUT: {
      BY_ID: "/api/software-versions/:id",
    },
    DELETE: {
      BY_ID: "/api/software-versions/:id",
    },
  },
  ORDER: {
    GET: {
      ALL: "/api/orders",
      BY_ID: "/api/orders/:id",
    },
    POST: {
      ALL: "/api/orders",
      FIND: "/api/orders/find",
    },
    PUT: {
      BY_ID: "/api/orders/:id",
    },
    DELETE: {
      BY_ID: "/api/orders/:id",
    },
  },
  USER: {
    GET: {
      ALL: "/api/users",
      BY_ID: "/api/users/:id",
      PROFILE: "/api/user/profile",
      PUBLIC_PROFILE: "/api/user/public/:slug",
    },
    POST: {
      CREATE: "/api/users",
    },
    PUT: {
      ROLE: "/api/users/:id/role",
      RESET_PASSWORD: "/api/users/:id/reset-password",
    },
    DELETE: {
      BY_ID: "/api/users/:id",
    },
  },
  SUBSCRIPTION: {
    GET: {
      PLANS: "/api/subscription-plans",
      PLAN_BY_ID: "/api/subscription-plans/:id",
      USER_SUBSCRIPTIONS: "/api/subscriptions/user",
      ALL_SUBSCRIPTIONS: "/api/subscriptions",
      BY_ID: "/api/subscriptions/:id",
    },
    POST: {
      CREATE_PLAN: "/api/subscription-plans",
      CREATE: "/api/subscriptions",
    },
    PUT: {
      UPDATE_PLAN: "/api/subscription-plans/:id",
      UPDATE_STATUS: "/api/subscriptions/:id/status",
      EXTEND: "/api/subscriptions/:id/extend",
      CANCEL: "/api/subscriptions/:id/cancel",
    },
    DELETE: {
      PLAN: "/api/subscription-plans/:id",
    },
  },
};

export default API;