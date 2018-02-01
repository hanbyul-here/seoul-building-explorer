var map = L.Mapzen.map('map', {
  iframeDetection: true,
  minZoom: 10,
  maxZoom: 18,
  attribution: '<a href="https://github.com/hanbyul-here/seoul-building-explorer">GitHub Repo</a>' + ' | ' + '<a href="http://openapi.nsdi.go.kr/nsdi/eios/ServiceDetail.do?svcSe=F&svcId=F010">NSDI</a>' + ' | ' + '<a href="https://openstreetmap.org/copyright">OpenStreetMap</a>, and <a href="https://www.mapzen.com/rights/#services-and-data-sources">others</a>' ,
  tangramOptions: {
    scene: 'assets/date.yaml'
  }
});

map.setView([37.5749, 126.9761], 16);

// moves zoom control to the bottom right of the map page
map.zoomControl.setPosition('bottomright');

// allows for a URL hash to be created
L.Mapzen.hash({
  map: map
});

var scene;
var tooltip = L.tooltip();

map.on('tangramloaded', function(e) {

  scene = e.tangramLayer.scene;
  if(scene.config.global.ux_language != globalAsset.lang) {
    scene.config.global.ux_language = globalAsset.lang;
    scene.updateConfig();
  }

  map.getContainer().addEventListener('click', function (event) {
  var latlng = map.mouseEventToLatLng(event);
  var pixel = { x: event.clientX, y: event.clientY };

  scene.getFeatureAt(pixel).then(function(selection) {
    if (map.getZoom() > 15) {
      // var parsedFeature = JSON.parse(selection.feature.properties);
      if(selection.feature && selection.feature.source_name.includes('seoul-buildings')) {
        tooltip.setLatLng(latlng);
        var dongNames = selection.feature.properties.dongName.split(' ');
        var tooltipContentText = '';
        if (globalAsset.lang == 'kr') {
          tooltipContentText = globalAsset.dong[globalAsset.lang]+' : ' +  dongNames[1] +' '+ dongNames[2]  + '<br>' +
          globalAsset.address[globalAsset.lang]+' : ' +  selection.feature.properties.address  + '<br>' +
          globalAsset.date[globalAsset.lang]+' : ' + formatTooltipText(selection.feature.properties.year);
        } else {
          tooltipContentText = globalAsset.date[globalAsset.lang]+' : ' + formatTooltipText(selection.feature.properties.year);
        }
        tooltip.setContent(tooltipContentText);
        if (!tooltip.isOpen()) {
          tooltip.addTo(map);
        }
      } else {
        if (tooltip.isOpen()) tooltip.remove();
      }
    } else {
        if(selection.feature && selection.feature.source_name == 'seoul-dongs') {
          tooltip.setLatLng(latlng);
          var formattedYear = selection.feature.properties.average + globalAsset.yearSuffix[globalAsset.lang] || globalAsset.undefined[globalAsset.lang];
          var currentLanguageFeature = globalAsset.lang + '_name';
          tooltip.setContent(
            globalAsset.dong[globalAsset.lang]+': ' +selection.feature.properties[currentLanguageFeature] + '<br>' +
            globalAsset.averageYear[globalAsset.lang]+': ' + formattedYear )
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
    if (globalAsset.lang == 'kr') {
      if (string[4] == 0 && string[6] == 0 ) return string[0] + string[1] + string[2] + string[3] + '년 '+ string[5] +' 월' + string[7] + '일';
      if (string[4] != 0 && string[6] == 0 ) return string[0] + string[1] + string[2] + string[3] + '년 '+ string[4] + string[5] +' 월' + string[7] + '일';
      else if (string[4] == 0 && string[6] != 0 ) return string[0] + string[1] + string[2] + string[3] + '년 '+  string[5] +' 월' + string[6] + string[7] + '일';
      else return string[0] + string[1] + string[2] + string[3] + '년 '+ string[4] + string[5] +' 월' + string[6] + string[7] + '일';
    } else {
      if (string[4] == 0 && string[6] == 0 ) return string[5] +'/' + string[7] + ' ' + string[0] + string[1] + string[2] + string[3];
      if (string[4] != 0 && string[6] == 0 ) return string[4] + string[5] +'/' + string[7] + ' ' + string[0] + string[1] + string[2] + string[3];
      else if (string[4] == 0 && string[6] != 0 ) return string[5] +'/' + string[6] + string[7] + ' ' + string[0] + string[1] + string[2] + string[3] + '';
      else return string[4] + string[5] +'/' + string[6] + string[7] + ' ' + string[0] + string[1] + string[2] + string[3] ;
    }
  } else {
    return globalAsset.undefined[globalAsset.lang];
  }
}


var turnOffColorBlocks = function () {
  var colorBlocks = document.querySelectorAll('.colorblock');
  for (var i = 0, j = colorBlocks.length; i < j; i++) {
    colorBlocks[i].classList.remove('selected');
  }
}

// Put category selector on the map
var categoryLegend = L.control({position: 'topright'});

categoryLegend.onAdd = function(map) {

  var wrapperDiv = L.DomUtil.create('div', 'option-wrapper');
  var loadingDiv = L.DomUtil.create('div', 'loading');
  var descriptionDiv = L.DomUtil.create('div', 'desc');
  descriptionDiv.innerHTML = '<h3>'+ globalAsset.title[globalAsset.lang]+'</h3><p>'+globalAsset.description[globalAsset.lang]+'</p>';
  wrapperDiv.appendChild(loadingDiv);
  wrapperDiv.appendChild(descriptionDiv);

  var slider = L.DomUtil.create('div');
  slider.style.height = '30px';

  for (var i = globalAsset.viridis.length-1; i > -1; i--) {
    var colorBlock = L.DomUtil.create('div');
    colorBlock.className += 'colorblock';
    colorBlock.style.backgroundColor = globalAsset.viridis[i];
    colorBlock.setAttribute('year', (201 - i));
    colorBlock.innerHTML  = 2010 - (i*10) ;
    colorBlock.addEventListener('click', function () {
    turnOffColorBlocks();
    this.classList.add('selected');
      scene.config.global.age = this.getAttribute('year');
      loadingDiv.style.visibility = 'visible';
      scene.updateConfig().then(function () {
        loadingDiv.style.visibility = 'hidden';
      })

    })
    slider.appendChild(colorBlock);
  }
  wrapperDiv.appendChild(slider);
  var resetButton = L.DomUtil.create('button');
  resetButton.className +='reset'
  resetButton.innerHTML = globalAsset.show[globalAsset.lang];
  resetButton.addEventListener('click', function () {
    turnOffColorBlocks();
    scene.config.global.age = null;
    loadingDiv.style.visibility = 'visible';
    scene.updateConfig().then(function () {
      loadingDiv.style.visibility = 'hidden';
    })
  })
  wrapperDiv.appendChild(resetButton);

  return wrapperDiv;
}

categoryLegend.addTo(map);

var geocoder = L.Mapzen.geocoder('ge-d50cd6f6907b3fa3');
geocoder.addTo(map);