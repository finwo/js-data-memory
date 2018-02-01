// This file has been copied from the js-data-http project
// See: https://github.com/js-data/js-data-http/blob/v2/scripts/authors.js

var exec = require('child_process').exec,
    fs   = require('fs');

console.log('Writing CONTRIBUTORS file...');

var contributorsFile = fs.readFileSync(__dirname + '/CONTRIBUTORS.md', {
  encoding : 'utf-8'
});

var tty = process.platform === 'win32' ? 'CON' : '/dev/tty';

exec('git shortlog -s -e < ' + tty, function (err, stdout, stderr) {
  if ( err ) {
    console.error(err);
    process.exit(-1);
  } else {
    var contributors = {};

    // Start processing the output
    stdout
      .split('\n')
      .map(function (line) {
        return line.trim();
      })
      .forEach(function (line) {
        // 0: Full match
        // 1: Commit count
        // 2: Contributor name
        // 3: Contributor email
        var parsed = /^(\d+)\t([\w ]+?) <(\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+)>/i.exec(line);
        if ( !parsed ) return;

        // Unknown = not good
        if ( parsed[2] === 'Unknown' ) {
          parsed[2] = '';
        }

        // Make the record exists
        contributors[parsed[3]] = contributors[parsed[3]] || {
          commits : 0,
          name    : parsed[2],
          email   : parsed[3]
        };

        // Merge the old & new record
        contributors[parsed[3]].commits += parseInt(parsed[1]);
        contributors[parsed[3]].name = parsed[2].length > contributors[parsed[3]].name.length ? parsed[2] : contributors[parsed[3]].name
      });

    var output = contributorsFile + Object.keys(contributors).map(function (key) {
                                                  var contributor = contributors[key];
                                                  return contributor.commits.toString(10) + ' | ' + contributor.name + ' | ' + contributor.email;
                                                })
                                                .join('\n') + '\n';

    // Add to or otherwise modify "names" if necessary
    fs.writeFileSync(__dirname + '/../CONTRIBUTORS.md', output, {
      encoding : 'utf-8'
    });
    console.log('Done!');
  }
});
