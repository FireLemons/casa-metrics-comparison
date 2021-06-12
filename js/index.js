// Writes text to a file and prompts to save it
//   @param {string} content  The contents of the file to be created
//   @param {string} filename The default name of the file to be generated
function downloadToTextFile(content, filename) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: 'text/plain'});

  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();

	URL.revokeObjectURL(a.href);
}

// Fetches JSON from a url
//   @param  {string} url The url of the JSON
//     @param {object} The JSON as an object
//   @return {promise} A Promise representing the request. Resolves with the JSON as an object
function getJSON (url) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          resolve(JSON.parse(this.responseText))
        } else {
          reject(`Request to ${url} Failed`)
          console.error(`Status code: ${this.status}`)
        }
      }
    }

    request.onerror = function () {
      reject(`Request to ${url} Failed`)
      console.error('Request Response:')
      console.error(request.responseText)
    }

    request.open("get", url, true);
    request.send();
  });
}

const app = new Vue({
  el: '#app',
  data: {
    clearLocalStorageCounter: 4,
    global: {
      'Average Note Length(characters)': { savedValue: 0, newValue: 0 },
      'Number of Case Contacts With Notes': { savedValue: 0, newValue: 0 },
      'Number of Case Contacts Without Notes': { savedValue: 0, newValue: 0 },
      'Total Hours in Case Contacts': { savedValue: 0, newValue: 0 }
    },
    meta: {
      'last updated': new Date()
    },
    notifications: [],
    orgs: [
      {
        'name': 'Prince George'
      }, 
      {
        'name': 'Montgomery'
      }
    ],
    requests: {}
  },
  computed: {
    backup: function () {
      const textarea = document.querySelector('textarea')
      textarea.style.height = `${textarea.scrollHeight}px`
      return `localStorage.setItem('metrics', JSON.stringify(${JSON.stringify(this.saveData, null, 2)}))`
    },

    clearLocalStorageText: function () {
      if (this.clearLocalStorageCounter === 4) {
        return 'Clear Local Storage'
      } else if (this.clearLocalStorageCounter === 0) {
        return `Click 1 more time to clear local storage`
      } else {
        return `Click ${this.clearLocalStorageCounter + 1} more times to clear local storage`
      }
    },

    diffs: function () {
      const orgs = {}

      this.orgs.forEach((org) => {
        if (org) {
          orgs[org.name] = this.diffMetrics(org.metrics)
        }
      })

      const globalDiff = this.diffMetrics(this.global)

      return {
        'orgs': orgs,
        'global': globalDiff
      }
    },

    hoursSinceLastUpdated: function () {
      return Math.round((new Date() - this.meta['last updated']) / 3600000)
    },

    saveData: function () {
      return {
        global: this.global,
        meta: {
          'last updated': this.meta['last updated'].toJSON()
        },
        orgs: this.orgs
      }
    }
  },
  methods: {
    // Produces a metrics hash map where the values are the difference(new - old)
    //   @param  {object} The object containing the metrics where the keys are a description of the metric and the values are the metric value
    //   @return {object} An object representing the difference in metrics similar to the input object
    diffMetrics: function (metrics) {
      const diff = {}

      for (label in metrics) {
        diff[label] = metrics[label].newValue - metrics[label].savedValue
      }

      return diff
    },

    // Prompts the user to download a copy of the backup script
    download: function () {
      downloadToTextFile(this.backup, 'backup.js');
    },

    // Handles updating a global metric where the data is an array of elements in the form [org, metric value]
    //   @param {string} url The url of the updated metric JSON data
    //   @param {string} metricName The key of the metric to be updated
    handleGlobalMetric: function (url, metricName) {
      getJSON(url)
      .then((data) => {
        data.values.forEach((val) => {
          this.updateMetric(metricName, 'global', val[0])
        })

        this.requests[metricName] = 'loaded'
      })
      .catch((error) => {
        this.notify('error', error)
      })
    },

    // Handles updating an org metric where the data is an array of elements in the form [org, metric value(s)...]
    //   @param {string} url The url of the updated metric JSON data
    //   @param {string(s)...} The name(s) of the metric(s) to be updated in the same order they would appear in the row recieved
    handleSimpleOrgMetric: function (url) {
      let metrics = Array.prototype.slice.call(arguments, 1)

      getJSON(url)
      .then((data) => {
        data.values.forEach((val) => {
          if (this.orgs[val[0] - 1]) {
            metrics.forEach((metric, i) => {
              this.updateMetric(metric, val[0] - 1, val[i + 1])
            })
          }
        })

        metrics.forEach((metric, i) => {
          this.requests[metric] = 'loaded'
        })
      })
      .catch((error) => {
        this.notify('error', error)
      })
    },

    // Displays a dismissable toast notification
    //   @param {string} level The logging level of the message
    //     error Failures
    //     info  General Information
    //   @param {string} message The message to be displayed
    notify: function (level, message) {
      let color, prefix

      switch (level) {
        case 'error':
          color = 'red-text'
          prefix = 'ERROR:'
          break;
        case 'info':
          prefix = 'INFO:'
          break;
        default:
          console.log(new RangeError(`Undefined notification level: ${level}`))
          break;
      }

      this.notifications.push({
        color: color,
        text: `${prefix} ${message}`
      })
    },

    // Decrements safety counter if counter >= 1 otherwise clears localStorage and reset the counter
    onClickClearStorage: function () {
      if (this.clearLocalStorageCounter > 0) {
        this.clearLocalStorageCounter--
      } else {
        localStorage.removeItem('metrics')
        this.notify('info', 'Local Storage Cleared')
        this.clearLocalStorageCounter = 4
      }
    },

    // Sets the saved metrics as the current metrics
    save: function () {
      this.meta['last updated'] = new Date()

      this.orgs.map((org) => org.metrics).concat(this.global).forEach((metrics) => {
        for(metric in metrics) {
          metrics[metric].savedValue = metrics[metric].newValue
        }
      })

      localStorage.setItem('metrics', JSON.stringify(this.saveData))
    },

    // Sets a metric's "newValue"
    //   @param {string}          name The key of the metric to be updated
    //   @param {string | number} owner Either the org id or 'global'; indicating which object the metric belongs to
    //   @param {number}          value The value of the metric to be set
    updateMetric: function (name, owner, value) {
      if (owner === 'global') {
        this.global[name].newValue = Number.isInteger(value) ? value : Math.round(value)
      } else {
        this.orgs[owner].metrics[name].newValue = Number.isInteger(value) ? value : Math.round(value)
      }
    }
  },
  created: function () {
    const defaultMetrics = {}
    const orgMetrics = ['Accepted Invitations', 'Unaccepted Invitations', 'Cases With Mandates', 'Case Contact Count', 'Case Contact Count in Last 2 Weeks', 'Users Who Have Added Case Contacts in Last 2 Weeks', 'Notification Count', 'Percent of Notifications Read', 'Volunteers Assigned to Supervisors']
    const savedData = JSON.parse(localStorage.getItem('metrics'))

    // Construct default metrics object
    orgMetrics.forEach((metricName) => {
      defaultMetrics[metricName] = { savedValue: 0, newValue: 0 }
    })

    // Fill in metrics for each org
    this.orgs.forEach((org) => {
      this.$set(org, 'metrics', JSON.parse(JSON.stringify(defaultMetrics)))
    })

    // Load Save
    if (savedData) {
      this.global = Object.assign(this.global, savedData.global)

      this.meta = {
        'last updated': new Date(savedData.meta['last updated'])
      }

      this.orgs.forEach((org, i) => {
        this.orgs[i] = {
          'name': org.name,
          'metrics': Object.assign(this.orgs[i].metrics, savedData.orgs[i].metrics)
        }
      })
    }

    // Generate JSON Requests Tracking List
    for (metric in this.global) {
      this.$set(this.requests, metric, 'unloaded')
    }

    for (metric in this.orgs[0].metrics) {
      this.$set(this.requests, metric, 'unloaded')
    }

  },
  mounted: function () {
    // Fetch Current Metric Data
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/idfolumrbaubogbmewdoeyahhdtj.json', 'Case Contact Count')
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/fairemyutljnkjgwldlaqtpecvvt.json', 'Cases With Mandates')
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/ahvopfhogmvuccdzdnncmwlioidd.json', 'Users Who Have Added Case Contacts in Last 2 Weeks', 'Case Contact Count in Last 2 Weeks')
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/ymbdlyldhiiqcmsslbjfjdjmzwco.json', 'Volunteers Assigned to Supervisors')
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/xsikhducnqfdrmfcntvdhtehuuwp.json', 'Notification Count', 'Percent of Notifications Read')
    this.handleGlobalMetric('https://data.heroku.com/dataclips/vgblwvzhclatsdxzdbihypqulckq.json', 'Total Hours in Case Contacts')

    getJSON('https://data.heroku.com/dataclips/ibzctyhepsfsgpiobxrltuhejxds.json')
    .then((data) => {
      data.values.forEach((val) => {
        let metric = val[1] ? 'Accepted Invitations' : 'Unaccepted Invitations'

        if (this.orgs[val[0] - 1]) {
          this.updateMetric(metric, val[0] - 1, val[2])
        }
      })

      this.requests['Accepted Invitations'] = 'loaded'
      this.requests['Unaccepted Invitations'] = 'loaded'
    })
    .catch((error) => {
      this.notify('error', error)
    })

    getJSON('https://data.heroku.com/dataclips/offxulwauuaqdjxviyugdqaygexw.json')
    .then((data) => {
      data.values.forEach((val) => {
        if (val[0]) {
          this.updateMetric('Number of Case Contacts With Notes', 'global', val[3])
          this.updateMetric('Average Note Length(characters)', 'global', val[2])
        } else {
          this.updateMetric('Number of Case Contacts Without Notes', 'global', val[3])
        }

        this.requests['Average Note Length(characters)'] = 'loaded'
        this.requests['Number of Case Contacts With Notes'] = 'loaded'
        this.requests['Number of Case Contacts Without Notes'] = 'loaded'
      })
    })
    .catch((error) => {
      this.notify('error', error)
    })
  }
})
