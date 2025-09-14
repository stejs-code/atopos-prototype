const presenterRegistry = {
  User: { declaration: () => import("#controllers/user_presenter.js"), metadata: {"fileName":"user_presenter","className":"UserPresenter","methods":[{"name":"actionDetail","parameters":[{"name":"id","type":"String","optional":true,"purpose":"parameter"},{"name":"data","type":"any","optional":false,"purpose":"bodyData"},{"name":"x","type":"Boolean","optional":false,"purpose":"parameter"}],"purpose":"action"}]}}
} as const;

export default presenterRegistry
