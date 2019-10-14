const Dependency = require('./Dependency');

class EntryDependency extends Dependency {
  constructor(props) {
    super(props);
    this.type = 'entry';
    this.name = props.name;
  }
}

module.exports = EntryDependency;
