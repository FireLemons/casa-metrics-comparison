function downloadToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], {type: contentType});

  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();

	URL.revokeObjectURL(a.href);
}

function getJSON (url, callback) {
  const request = new XMLHttpRequest()

  request.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      callback(JSON.parse(this.responseText))
    } else if (this.readyState === 4 && this.status !== 200){
      console.error(`Request to ${url} Failed`)
    }
  }

  request.open("get", url, true);
  request.send();
}

function makeDiff (stats) {
  const diff = {}

  for (label in stats) {
    diff[label] = stats[label].newValue - stats[label].savedValue
  }

  return diff
}

const app = new Vue({
  el: '#app',
  data: {
    orgs: {
      'Prince George': {
        'Accepted Invitations'                              : {savedValue: 0, newValue: 0},
        'Unaccepted Invitations'                            : {savedValue: 0, newValue: 0},
        'Cases With Mandates'                               : {savedValue: 0, newValue: 0},
        'Case Contact Count'                                : {savedValue: 0, newValue: 0},
        'Case Contact Count in Last 2 Weeks'                : {savedValue: 0, newValue: 0},
        'Users Who Have Added Case Contacts in Last 2 Weeks': {savedValue: 0, newValue: 0},
        'Notification Count'                                : {savedValue: 0, newValue: 0},
        'Volunteers Assigned to Supervisors'                : {savedValue: 0, newValue: 0}
      }, 
      'Montgomery': {
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
    global: {
      'Total Hours in Case Contacts': { savedValue: 0, newValue: 0}
    },
    queries: {
      'Accepted Invitations'                              : 'unloaded',
      'Unaccepted Invitations'                            : 'unloaded',
      'Cases With Mandates'                               : 'unloaded',
      'Case Contact Count'                                : 'unloaded',
      'Case Contact Count in Last 2 Weeks'                : 'unloaded',
      'Users Who Have Added Case Contacts in Last 2 Weeks': 'unloaded',
      'Notification Count'                                : 'unloaded',
      'Total Hours in Case Contacts'                      : 'unloaded',
      'Volunteers Assigned to Supervisors'                : 'unloaded'
    }
  },
  computed: {
    backup: function () {
      const textarea = document.querySelector('textarea')
      textarea.style.height = textarea.scrollHeight+'px'
      return `localStorage.setItem('metrics', JSON.stringify(${JSON.stringify({orgs: this.orgs, global: this.global}, null, 2)}))`
    },

    diffs: function () {
      const PGDiff = makeDiff(this.orgs['Prince George'])
      const MontgomeryDiff = makeDiff(this.orgs['Montgomery'])
      const globalDiff = makeDiff(this.global)

      return {
        orgs: {
          'Prince George': PGDiff,
          'Montgomery'   : MontgomeryDiff
        },

        global: globalDiff
      }
    }
  },
  methods: {
    download: function () {
      downloadToFile(this.backup, 'backup.js', 'text/plain');
    },
    save: function () {
      [this.orgs['Prince George'], this.orgs['Montgomery'], this.global].forEach((stats) => {
        for(stat in stats) {
          stats[stat].savedValue = stats[stat].newValue
        }
      })

      localStorage.setItem('metrics', JSON.stringify({orgs: this.orgs, global: this.global}))
    }
  },
  mounted: function() {
    const savedData = JSON.parse(localStorage.getItem('metrics'))

    if (savedData) {
      for (orgName in this.orgs) {
        this.orgs[orgName] = Object.assign(this.orgs[orgName], savedData.orgs[orgName])
      }

      this.global = Object.assign(this.global, savedData.global)
    }

    getJSON('https://data.heroku.com/dataclips/idfolumrbaubogbmewdoeyahhdtj.json', (data) => {
      const queryName = 'Case Contact Count'

      data.values.forEach((val) => {
        let orgName

        switch (val[0]) {
          case 1:
            orgName = 'Prince George'
            break
          case 2:
            orgName = 'Montgomery'
            break
        }

        if (orgName) {
          this.orgs[orgName][queryName].newValue = val[1]
        }
      })

      this.queries[queryName] = 'loaded'
    })

    getJSON('https://data.heroku.com/dataclips/ymbdlyldhiiqcmsslbjfjdjmzwco.json', (data) => {
      const queryName = 'Volunteers Assigned to Supervisors'

      data.values.forEach((val) => {
        let orgName

        switch (val[0]) {
          case 1:
            orgName = 'Prince George'
            break
          case 2:
            orgName = 'Montgomery'
            break
        }

        if (orgName) {
          this.orgs[orgName][queryName].newValue = val[1]
        }
      })

      this.queries[queryName] = 'loaded'
    })

    getJSON('https://data.heroku.com/dataclips/xsikhducnqfdrmfcntvdhtehuuwp.json', (data) => {
      const queryName = 'Notification Count'

      data.values.forEach((val) => {
        let orgName

        switch (val[0]) {
          case 1:
            orgName = 'Prince George'
            break
          case 2:
            orgName = 'Montgomery'
            break
        }

        this.orgs[orgName][queryName].newValue = val[1]
      })

      this.queries[queryName] = 'loaded'
    })

    getJSON('https://data.heroku.com/dataclips/fairemyutljnkjgwldlaqtpecvvt.json', (data) => {
      const queryName = 'Cases With Mandates'

      data.values.forEach((val) => {
        let orgName

        switch (val[0]) {
          case 1:
            orgName = 'Prince George'
            break
          case 2:
            orgName = 'Montgomery'
            break
        }

        this.orgs[orgName][queryName].newValue = val[1]
      })

      this.queries[queryName] = 'loaded'
    })

    getJSON('https://data.heroku.com/dataclips/ibzctyhepsfsgpiobxrltuhejxds.json', (data) => {
      data.values.forEach((val) => {
        let orgName, orgStat

        switch (val[0]) {
          case 1:
            orgName = 'Prince George'
            break
          case 2:
            orgName = 'Montgomery'
            break
        }

        switch (val[1]) {
          case true:
            orgStat = 'Accepted Invitations'
            break
          case false:
            orgStat = 'Unaccepted Invitations'
            break
        }

        if (orgName) {
          this.orgs[orgName][orgStat].newValue = val[2]
        }
      })

      this.queries['Accepted Invitations'] = 'loaded'
      this.queries['Unaccepted Invitations'] = 'loaded'
    })

    getJSON('https://data.heroku.com/dataclips/vgblwvzhclatsdxzdbihypqulckq.json', (data) => {
      const queryName = 'Total Hours in Case Contacts'

      data.values.forEach((val) => {
        this.global[queryName].newValue = Math.round(val[0])
      })

      this.queries[queryName] = 'loaded'
    })

    getJSON('https://data.heroku.com/dataclips/ahvopfhogmvuccdzdnncmwlioidd.json', (data) => {
      data.values.forEach((val) => {
        let orgName

        switch (val[0]) {
          case 1:
            orgName = 'Prince George'
            break
          case 2:
            orgName = 'Montgomery'
            break
        }

        if (orgName) {
          this.orgs[orgName]['Users Who Have Added Case Contacts in Last 2 Weeks'].newValue = val[1]
          this.orgs[orgName]['Case Contact Count in Last 2 Weeks'].newValue = val[2]
        }
      })

      this.queries['Users Who Have Added Case Contacts in Last 2 Weeks'] = 'loaded'
      this.queries['Case Contact Count in Last 2 Weeks'] = 'loaded'
    })
  }
})
