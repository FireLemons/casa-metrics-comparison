function makeDiff (stats) {
  const diff = {}

  for (label in stats) {
    diff[label] = stats[label].newValue - stats[label].savedValue
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
        'Unccepted Invitations'             : { savedValue: 0, newValue: 0},
        'Cases With Mandates'               : { savedValue: 0, newValue: 0},
        'Case Contact Count'                : { savedValue: 0, newValue: 0},
        'Notification Count'                : { savedValue: 0, newValue: 0},
        'Volunteers Assigned to Supervisors': { savedValue: 0, newValue: 0}
      }, 
      'Montgomery': {
        'Accepted Invitations'              : { savedValue: 0, newValue: 0},
        'Unccepted Invitations'             : { savedValue: 0, newValue: 0},
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

      console.log(PGDiff)

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
    }
  },
  mounted: function() {
    getJSON("https://data.heroku.com/dataclips/idfolumrbaubogbmewdoeyahhdtj.json", (data) => {
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
  }
})
