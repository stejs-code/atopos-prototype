const presenterRegistry = {
  User: { declaration: () => import("#controllers/user_presenter").then(m => m.default), metadata: {"fileName":"user_presenter","className":"UserPresenter","methods":[{"name":"startup","parameters":[],"purpose":"unknown"},{"name":"actionDetail","parameters":[{"name":"id","type":"String","optional":false,"purpose":"parameter"}],"purpose":"action"},{"name":"actionEdit","parameters":[{"name":"id","type":"String","optional":false,"purpose":"parameter"}],"purpose":"action"}]}}
} as const;

export default presenterRegistry
