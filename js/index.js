function makeDiff (stats) {
  const diff = {}

  for (label in stats) {
    diff[label] = stats[label][1] - stats[label][0]
  }

  return diff
}

const app = new Vue({
  el: '#app',
  data: {
    orgs: [
      {
        'Accepted Invitations'              : [0, 0],
        'Unccepted Invitations'             : [0, 0],
        'Cases With Mandates'               : [0, 0],
        'Case Contact Count'                : [0, 0],
        'Notification Count'                : [0, 0],
        'Volunteers Assigned to Supervisors': [0, 0]
      }, {
        'Accepted Invitations'              : [0, 0],
        'Unccepted Invitations'             : [0, 0],
        'Case Contact Count'                : [0, 0],
        'Cases With Mandates'               : [0, 0],
        'Notification Count'                : [0, 0],
        'Volunteers Assigned to Supervisors': [0, 0]
      }
    ],
    global: {
      'Total Hours in Case Contacts': [0, 0]
    }
  },
  computed: {
    diffs: function () {
      const PGDiff = makeDiff(this.orgs[0])
      const MontgomeryDiff = makeDiff(this.orgs[1])
      const globalDiff = makeDiff(this.global)

      return {
        orgs: [
          PGDiff, MontgomeryDiff
        ],

        global: globalDiff
      }
    }
  },
  methods: {
    save: function () {
    }
  },
  mounted: function() {
    const caseContactCountRequest = new XMLHttpRequest()

    caseContactCountRequest.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        console.log(this.responseText);
      }
    }

    //caseContactCountRequest.open("GET", "https://data.heroku.com/dataclips/idfolumrbaubogbmewdoeyahhdtj.json", true);
    //caseContactCountRequest.send();
  }
})
