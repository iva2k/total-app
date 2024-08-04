declare module 'backloop.dev' {
  const httpsOptions: {
    key: string;
    cert: string;
    ca: string;
  };
  export default httpsOptions;
}
