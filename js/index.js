function makeDiff (stats) {
  const diff = {}

  for (label in stats) {
    diff[label] = Math.round(stats[label].newValue - stats[label].savedValue)
  }

  return diff
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

const app = new Vue({
  el: '#app',
  data: {
    orgs: {
      'Prince George': {
        'Accepted Invitations'              : { savedValue: 0, newValue: 0},
        'Unaccepted Invitations'            : { savedValue: 0, newValue: 0},
        'Cases With Mandates'               : { savedValue: 0, newValue: 0},
        'Case Contact Count'                : { savedValue: 0, newValue: 0},
        'Notification Count'                : { savedValue: 0, newValue: 0},
        'Volunteers Assigned to Supervisors': { savedValue: 0, newValue: 0}
      }, 
      'Montgomery': {
        'Accepted Invitations'              : { savedValue: 0, newValue: 0},
        'Unaccepted Invitations'            : { savedValue: 0, newValue: 0},
        'Cases With Mandates'               : { savedValue: 0, newValue: 0},
        'Case Contact Count'                : { savedValue: 0, newValue: 0},
        'Notification Count'                : { savedValue: 0, newValue: 0},
        'Volunteers Assigned to Supervisors': { savedValue: 0, newValue: 0}
      }
    },
    global: {
      'Total Hours in Case Contacts': { savedValue: 0, newValue: 0}
    }
  },
  computed: {
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
    save: function () {
      localStorage.getItem('metrics', JSON.stringify({orgs: this.orgs, global: this.global}))
    }
  },
  mounted: function() {
    getJSON('https://data.heroku.com/dataclips/idfolumrbaubogbmewdoeyahhdtj.json', (data) => {
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

        this.orgs[orgName]['Case Contact Count'].newValue = val[1]
      })

      console.log('Loaded Case Contact Counts')
    })

    getJSON('https://data.heroku.com/dataclips/ymbdlyldhiiqcmsslbjfjdjmzwco.json', (data) => {
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

        this.orgs[orgName]['Volunteers Assigned to Supervisors'].newValue = val[1]
      })

      console.log('Loaded Volunteers Assigned to Supervisors Count')
    })

    getJSON('https://data.heroku.com/dataclips/xsikhducnqfdrmfcntvdhtehuuwp.json', (data) => {
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

        this.orgs[orgName]['Notification Count'].newValue = val[1]
      })

      console.log('Loaded Notification Count')
    })

    getJSON('https://data.heroku.com/dataclips/fairemyutljnkjgwldlaqtpecvvt.json', (data) => {
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

        this.orgs[orgName]['Cases With Mandates'].newValue = val[1]
      })

      console.log('Loaded Cases With Mandates Count')
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

        this.orgs[orgName][orgStat].newValue = val[2]
      })

      console.log('Loaded Accepted/Unaccepted Invitations')
    })

    getJSON('https://data.heroku.com/dataclips/vgblwvzhclatsdxzdbihypqulckq.json', (data) => {
      data.values.forEach((val) => {
        this.global['Total Hours in Case Contacts'].newValue = val[0]
      })

      console.log('Loaded Total Hours in Case Contacts')
    })
  }
})
