L.Mapzen.apiKey = 'vector-tiles-YFe1Dop';

var map = L.Mapzen.map('map', {
  minZoom: 10,
  maxZoom: 17,
  tangramOptions: {
    scene: 'assets/date.yaml'
  }
});

var geocoder = L.Mapzen.geocoder();
geocoder.addTo(map);

map.setView([37.5749, 126.9761], 15);

// moves zoom control to the bottom right of the map page
map.zoomControl.setPosition('bottomright');

// allows for a URL hash to be created
L.Mapzen.hash({
  map: map
});

var scene;
var tooltip = L.tooltip();

var searchScheme = [{
  code: 'A3',
  codeValue: '법정동',
  category: './js/data-scheme/beobjung.json'
}, {
  code: 'A16',
  codeValue: '높이 (Height)',
  min: 1,
  max: 100,
  initialValue: 20,
  step: 2,
  formatText: function(string) {
    return string + 'm 이상';
  }
}]

map.on('tangramloaded', function(e) {

  scene = e.tangramLayer.scene;
  map.getContainer().addEventListener('click', function (event) {
  var latlng = map.mouseEventToLatLng(event);
  var pixel = { x: event.clientX, y: event.clientY };

  map.on('zoomend', function () {
    // if(map.getZoom() < 15 ) {
    //   if (scene.config.global.age) {
    //     scene.config.global.age = null;
    //     scene.rebuild();
    //   }
    // }
  });


  scene.getFeatureAt(pixel).then(function(selection) {
    if (map.getZoom() > 15) {
      // var parsedFeature = JSON.parse(selection.feature.properties);
      if(selection.feature && selection.feature.source_name == 'seoul-buildings') {
        tooltip.setLatLng(latlng);
        tooltip.setContent(
          '법정동 : ' + selection.feature.properties.A3  + '<br>' +
          '사용승인일자 : ' + formatTooltipText(selection.feature.properties.A13));
        if (!tooltip.isOpen()) {
          tooltip.addTo(map);
        }
      } else {
        if (tooltip.isOpen()) tooltip.remove();
      }
    } else {
        if(selection.feature && selection.feature.source_name == 'seoul-dongs') {
          tooltip.setLatLng(latlng);
          var formattedYear = selection.feature.properties.average +'년' || '미등록';
          tooltip.setContent(
            '법정동이름: ' +selection.feature.properties.kr_name + '<br>' +
            '평균사용승인일자: ' + formattedYear )
          if (!tooltip.isOpen()) {
            tooltip.addTo(map);
          }
        } else {
          if (tooltip.isOpen()) tooltip.remove();
        }
      }
    });
  });
});



var formatTooltipText = function(string) {
  if (string) {
    if (string[4] == 0 && string[6] == 0 ) return string[0] + string[1] + string[2] + string[3] + '년 '+ string[5] +' 월' + string[7] + '일';
    if (string[4] != 0 && string[6] == 0 ) return string[0] + string[1] + string[2] + string[3] + '년 '+ string[4] + string[5] +' 월' + string[7] + '일';
    else if (string[4] == 0 && string[6] != 0 ) return string[0] + string[1] + string[2] + string[3] + '년 '+  string[5] +' 월' + string[6] + string[7] + '일';
    else return string[0] + string[1] + string[2] + string[3] + '년 '+ string[4] + string[5] +' 월' + string[6] + string[7] + '일';
  } else {
    return '미등록'
  }
}


// Put category selector on the map
var categoryLegend = L.control({position: 'topright'});

categoryLegend.onAdd = function(map) {

  var wrapperDiv = L.DomUtil.create('div', 'option-wrapper');
  var loadingDiv = L.DomUtil.create('div', 'loading');
  var descriptionDiv = L.DomUtil.create('div', 'desc');
  descriptionDiv.innerHTML = '<h3>Seoul Building Explorer</h3><p>서울 건물</p>';
  wrapperDiv.appendChild(loadingDiv);
  wrapperDiv.appendChild(descriptionDiv);

  var slider = L.DomUtil.create('div');
  slider.style.height = '30px';

  for (var  i = viridis.length-1; i > -1; i--) {
    var colorBlock = L.DomUtil.create('div');
    colorBlock.className += 'colorblock';
    colorBlock.style.backgroundColor = viridis[i];
    colorBlock.setAttribute('year', i);
    colorBlock.innerHTML  = 2010 - (i*10) ;
    colorBlock.addEventListener('click', function () {
      scene.config.global.age = this.getAttribute('year');
      loadingDiv.style.visibility = 'visible';
      scene.rebuild().then(function () {
        loadingDiv.style.visibility = 'hidden';
      })

    })
    slider.appendChild(colorBlock);
  }
  wrapperDiv.appendChild(slider);
  var resetButton = L.DomUtil.create('button');
  resetButton.className +='reset'
  resetButton.innerHTML = 'Show Everything';
  resetButton.addEventListener('click', function () {
    scene.config.global.age = null;
    loadingDiv.style.visibility = 'visible';
    scene.rebuild().then(function () {
      loadingDiv.style.visibility = 'hidden';
    })
  })
  wrapperDiv.appendChild(resetButton);

  return wrapperDiv;
}

categoryLegend.addTo(map);
