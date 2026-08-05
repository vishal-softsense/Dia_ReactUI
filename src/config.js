module.exports = {
  google: {
    API_KEY: "",
    CLIENT_ID: "",
    SECRET: "",
  },
  facebook: {
    APP_ID: "",
  },
  api: {
    API_URL: process.env.REACT_APP_API_URL || "https://localhost:7169",
    IMAGE_URL: process.env.REACT_APP_IMAGE_URL || "https://dia.softoncloud.com",
  }
};
