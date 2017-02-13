class Analytics {

  constructor (gapi, token, viewId, domIds) {
    this.gapi = gapi
    this.token = token
    this.domIds = domIds
    this.viewId = viewId
  }

  init (timedelta) {
    let self = this
    this.gapi.analytics.ready(function () { self.run(timedelta) })
  }

  run (timedelta) {
    let self = this
    let gapi = this.gapi
    gapi.analytics.ready(function () {
      /**
       * Authorize the user with an access token obtained server side.
       */
      gapi.analytics.auth.authorize({
        'serverAuth': {
          'access_token': self.token
        }
      })
      /**
       * Create a new ActiveUsers instance to be rendered inside of an
       * element with the id "active-users-container" and poll for changes every
       * five seconds.
       */
      var activeUsers = new gapi.analytics.ext.ActiveUsers({
        container: self.domIds.activeUsers,
        pollingInterval: 5
      })
      /**
       * Create a new ViewSelector2 instance to be rendered inside of an
       * element with the id "view-selector-container".
       */
      var viewSelector = new gapi.analytics.ext.ViewSelector2({
        container: self.domIds.viewSelector,
      })
      .execute()
      /**
       * Update the activeUsers component, the Chartjs charts, and the dashboard
       * title whenever the user changes the view.
       */
      viewSelector.on('viewChange', function (data) {
        // Start tracking active users for this view.
        activeUsers.set(data).execute()
      })

      let baseQuery = {
        'ids': 'ga:' + self.viewId,
        'start-date': timedelta,
        'end-date': 'yesterday'
      }

      /**
       * Creates a new DataChart instance showing sessions over the past 15 days.
       */
      let dataChart1 = new gapi.analytics.googleCharts.DataChart({
        query: {
          ...baseQuery,
          'metrics': 'ga:sessions,ga:users',
          'dimensions': 'ga:date'
        },
        chart: {
          'container': self.domIds.traffic,
          'type': 'LINE',
          'options': {
            'width': '100%'
          }
        }
      })
      dataChart1.execute()
      /**
       * Creates a new DataChart instance showing top 5 most popular pages
       */
      var dataChart2 = new gapi.analytics.googleCharts.DataChart({
        query: {
          ...baseQuery,
          'metrics': 'ga:pageviews',
          'dimensions': 'ga:pagePath',
          'sort': '-ga:pageviews',
          'max-results': 7
        },
        chart: {
          'container': self.domIds.popular,
          'type': 'PIE',
          'options': {
            'width': '100%',
            'pieHole': 4 / 9,
          }
        }
      })
      dataChart2.execute()
      /**
       * Creates a new DataChart instance showing top borwsers
       */
      var dataChart3 = new gapi.analytics.googleCharts.DataChart({
        query: {
          ...baseQuery,
          'metrics': 'ga:sessions',
          'dimensions': 'ga:browser',
          'sort': '-ga:sessions',
          'max-results': 7
        },
        chart: {
          'container': self.domIds.browsers,
          'type': 'PIE',
          'options': {
            'width': '100%',
            'pieHole': 4 / 9,
          }
        }
      })
      dataChart3.execute()
      /**
       * Creates a new DataChart instance showing top referral
       */
      var dataChart4 = new gapi.analytics.googleCharts.DataChart({
        query: {
          ...baseQuery,
          'metrics': 'ga:sessions',
          'dimensions': 'ga:source',
          'sort': '-ga:sessions',
          'max-results': 7
        },
        chart: {
          'container': self.domIds.acquisition,
          'type': 'PIE',
          'options': {
            'width': '100%',
            'pieHole': 4 / 9,
          }
        }
      })
      dataChart4.execute()
      /**
       * Creates a new DataChart instance showing top visitors continents
       */
      var dataChart5 = new gapi.analytics.googleCharts.DataChart({
        query: {
          ...baseQuery,
          'metrics': 'ga:sessions',
          'dimensions': 'ga:country',
          'sort': '-ga:sessions',
          'max-results': 7
        },
        chart: {
          'container': self.domIds.audience,
          'type': 'PIE',
          'options': {
            'width': '100%',
            'pieHole': 4 / 9,
          }
        }
      })
      dataChart5.execute()
      /**
       * Creates a new DataChart instance showing social interactions over the past 15 days.
       */
      var dataChart6 = new gapi.analytics.googleCharts.DataChart({
        query: {
          ...baseQuery,
          'metrics': 'ga:socialInteractions',
          'dimensions': 'ga:socialInteractionNetwork',
          'sort': '-ga:socialInteractions',
          'max-results': 7
        },
        chart: {
          'container': self.domIds.social,
          'type': 'PIE',
          'options': {
            'width': '100%',
            'pieHole': 4 / 9,
          }
        }
      })
      dataChart6.execute()
    })
  }
}

export default Analytics
