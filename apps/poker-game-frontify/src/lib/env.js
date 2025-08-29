
const ENVIRONMENTS = {
    DEVELOPMENT: "development",
    PRODUCTION: "production",
};

const CURRENT_ENV = ENVIRONMENTS.DEVELOPMENT;

const CONFIG = {
    [ENVIRONMENTS.DEVELOPMENT]: {
        USE_API: "https://01eb04f640ef.ngrok-free.app/",
        CLIENT_URL: "https://add-boost-360-test.web.app",
        GOOGLE_CLIENT_ID: '',

    },
    [ENVIRONMENTS.PRODUCTION]: {
        USE_API: "https://api.addboost360.com/",
        CLIENT_URL: "https://www.addboost360.com",
        GOOGLE_CLIENT_ID: '',
    },
};

const { USE_API, CLIENT_URL, GOOGLE_CLIENT_ID } = CONFIG[CURRENT_ENV];

export {
    GOOGLE_CLIENT_ID,
    ENVIRONMENTS,
    CURRENT_ENV,
    USE_API,
    CLIENT_URL,
};
