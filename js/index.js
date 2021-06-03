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

    request.onreadystatechange = function() {
      if (this.readyState === 4) {
        if (this.status === 200) {
          resolve(JSON.parse(this.responseText))
        } else {
          console.error(`Request to ${url} Failed`)
        }
      }
    }

    request.open("get", url, true);
    request.send();
  });
}

const app = new Vue({
  el: '#app',
  data: {
    orgs: [
      {
        'name': 'Prince George',
        'metrics' : {
          'Accepted Invitations'                              : {savedValue: 0, newValue: 0},
          'Unaccepted Invitations'                            : {savedValue: 0, newValue: 0},
          'Cases With Mandates'                               : {savedValue: 0, newValue: 0},
          'Case Contact Count'                                : {savedValue: 0, newValue: 0},
          'Case Contact Count in Last 2 Weeks'                : {savedValue: 0, newValue: 0},
          'Users Who Have Added Case Contacts in Last 2 Weeks': {savedValue: 0, newValue: 0},
          'Notification Count'                                : {savedValue: 0, newValue: 0},
          'Volunteers Assigned to Supervisors'                : {savedValue: 0, newValue: 0}
        }
      }, 
      {
        'name': 'Montgomery',
        'metrics': {
          'Accepted Invitations'                              : {savedValue: 0, newValue: 0},
          'Unaccepted Invitations'                            : {savedValue: 0, newValue: 0},
          'Cases With Mandates'                               : {savedValue: 0, newValue: 0},
          'Case Contact Count'                                : {savedValue: 0, newValue: 0},
          'Case Contact Count in Last 2 Weeks'                : {savedValue: 0, newValue: 0},
          'Users Who Have Added Case Contacts in Last 2 Weeks': {savedValue: 0, newValue: 0},
          'Notification Count'                                : {savedValue: 0, newValue: 0},
          'Volunteers Assigned to Supervisors'                : {savedValue: 0, newValue: 0}
        }
      }
    ],
    global: {
      'Total Hours in Case Contacts': { savedValue: 0, newValue: 0}
    },
    requests: {}
  },
  computed: {
    backup: function () {
      const textarea = document.querySelector('textarea')
      textarea.style.height = textarea.scrollHeight+'px'
      return `localStorage.setItem('metrics', JSON.stringify(${JSON.stringify({orgs: this.orgs, global: this.global}, null, 2)}))`
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

    // Handles updating a global metric
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
    },

    // Handles updating an org metric where the data is an array of elements in the form [org, metric value]
    //   @param {string} url The url of the updated metric JSON data
    //   @param {string} metricName The key of the metric to be updated
    handleSimpleOrgMetric: function (url, metricName) {
      getJSON(url)
      .then((data) => {
        data.values.forEach((val) => {
          if (this.orgs[val[0] - 1]) {
            this.updateMetric(metricName, val[0] - 1, val[1])
          }
        })

        this.requests[metricName] = 'loaded'
      })
    },

    // Sets the saved metrics as the current metrics
    save: function () {
      this.orgs.map((org) => org.metrics).concat(this.global).forEach((metrics) => {
        for(metric in metrics) {
          metrics[metric].savedValue = metrics[metric].newValue
        }
      })

      localStorage.setItem('metrics', JSON.stringify({orgs: this.orgs, global: this.global}))
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
  mounted: function() {
    const savedData = JSON.parse(localStorage.getItem('metrics'))

    // Load Save
    if (savedData) {
      this.orgs.forEach((org, i) => {
        this.orgs[i] = {
          'name': org.name,
          'metrics': Object.assign(this.orgs[i].metrics, savedData.orgs[i].metrics)
        }
      })

      this.global = Object.assign(this.global, savedData.global)
    }

    // Generate JSON Requests Tracking List
    for (metric in this.global) {
      this.requests[metric] = 'unloaded'
    }

    for (metric in this.orgs[0]) {
      this.requests[metric] = 'unloaded'
    }

    // Fetch Current Metric Data
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/idfolumrbaubogbmewdoeyahhdtj.json', 'Case Contact Count')
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/ymbdlyldhiiqcmsslbjfjdjmzwco.json', 'Volunteers Assigned to Supervisors')
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/xsikhducnqfdrmfcntvdhtehuuwp.json', 'Notification Count')
    this.handleSimpleOrgMetric('https://data.heroku.com/dataclips/fairemyutljnkjgwldlaqtpecvvt.json', 'Cases With Mandates')
    this.handleGlobalMetric('https://data.heroku.com/dataclips/vgblwvzhclatsdxzdbihypqulckq.json', 'Total Hours in Case Contacts')

    getJSON('https://data.heroku.com/dataclips/ibzctyhepsfsgpiobxrltuhejxds.json')
    .then((data) => {
      data.values.forEach((val) => {
        let metric = val[1] ? 'Accepted Invitations' : 'Unaccepted Invitations'

        if (this.orgs[val[0] - 1]) {
          this.orgs[val[0] - 1].metrics[metric].newValue = val[2]
        }
      })

      this.requests['Accepted Invitations'] = 'loaded'
      this.requests['Unaccepted Invitations'] = 'loaded'
    })

    getJSON('https://data.heroku.com/dataclips/ahvopfhogmvuccdzdnncmwlioidd.json')
    .then((data) => {
      data.values.forEach((val) => {
        if (this.orgs[val[0] - 1]) {
          this.orgs[val[0] - 1].metrics['Users Who Have Added Case Contacts in Last 2 Weeks'].newValue = val[1]
          this.orgs[val[0] - 1].metrics['Case Contact Count in Last 2 Weeks'].newValue = val[2]
        }
      })

      this.requests['Users Who Have Added Case Contacts in Last 2 Weeks'] = 'loaded'
      this.requests['Case Contact Count in Last 2 Weeks'] = 'loaded'
    })
  }
})
