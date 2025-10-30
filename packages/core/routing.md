
```ts
import { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'
import { RouteGroup } from '@adonisjs/http-server'

const config = {
  i18n: {
    localeStrategy: 'url-based' | 'session',
    locales: defineLocales(
      'url-based',
      ({ makeLocale }) => ([
        // Default is the top one, if not specified otherwise
        defineLocale('cs') // localeID
          .subdomain()
          .canonical(), // If a locale cannot be determined, 
                        // then the canonical locale is automatically assumed

        defineLocale('en')
          .subdomain(),  // en.example.com

        defineLocale('en2')
          .subdomain('english-two'),  // english-two.example.com

        defineLocale('en')
          .path('/english'), // example.com/english

      ]),
    ),

    locales: defineLocales(
      'session',
      {
        define: ({ makeLocale }) => ([
          // Default is the top one, if not specified otherwise
          defineLocale('cs')
            .canonical(),

          defineLocale('en'),
        ]),

        async setLocale(httpContext: HttpContext, localeID: string) {
          // set locale to session storage or somewhere
        },

        async getLocale(httpContext: HttpContext): string {
          // get localeID for current request
        },
      },
    ),
  },


}


export const atoposConfig = defineAtopos({
  defineModules: ({ defineModule, defineLocales, defineListen }) => ({
    // If you wish to not specify any name, 
    // then use Default as the module name, 
    // so you don't need to specify it all the time
    Site: defineModule({ // E.g. for blog
      presentersDir: 'app/presenters/site', // this is the default assumption, 
                                            // only when the module name is Default, 
                                            // then the dir is defaultly app/presenters
      // route to this module
      // https://docs.adonisjs.com/guides/basics/routing#grouping-routes
      route: (route: RouteGroup) => route
        .domain(':tenant.example.com'), 
      
      locales: defineLocales(
        'url-based',
        ({ defineLocale }) => ([
          // Default is the top one, if not specified otherwise
          defineLocale('cs') // localeID
            .subdomain()
            .canonical(), // If a locale cannot be determined, 
                          // then the canonical locale is automatically assumed

          defineLocale('en')
            .subdomain(),  // en.example.com (uses the localeID by default)

          defineLocale('en2')
            .subdomain('english-two'),  // english-two.example.com

          defineLocale('en3')
            .path('/english-three'), // example.com/english-three

        ]),
      ),
    }),
  }),

})
```
