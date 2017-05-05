var HashFormatter = {
  parseHashToObj: function () {
    var dObj;
    var rawHash = window.location.hash;
    if (this.isEmpty(rawHash)) {
      return null;
    } else {
      var dObj = {};
      var hashVal = rawHash.replace('#', '');
      var valArrs = hashVal.split('&');

      for (var val in valArrs) {
        var keyAndValue = valArrs[val].split('=');
        dObj[keyAndValue[0]] = keyAndValue[1];
      }
      this.hashRun = true;
      return dObj;
    }
  },
  isEmpty: function (str) {
    if (str.length === 0 || !str) return true;
    else return false;
  }
}


if (HashFormatter.parseHashToObj()) {
  globalAsset.lang = HashFormatter.parseHashToObj().lang || 'en';
}