var map = L.Mapzen.map('map', {
  scene: 'assets/detailed-building.yaml',
  maxBounds: L.latLngBounds(
    L.latLng(37.697, 127.3),
    L.latLng(37.426, 126.683)
  )
});

map.setView([37.5749, 126.9761], 15);

// moves zoom control to the bottom right of the map page
map.zoomControl.setPosition('bottomright');

// allows for a URL hash to be created
L.Mapzen.hash({
  map: map
});

// adds a tangram event listener
var scene;
map.on('tangramloaded', function(e) {
  console.log(e.tangramLayer);
  scene = e.tangramLayer.scene;
  scene.subscribe({
    error: function(e) {
      console.log('scene error', e);
    },
    view_complete: function () {
        console.log('scene view complete');
        // document.getElementById('loading').style.visibility = 'hidden';
    }
  });
});

// var geocoder = L.Mapzen.geocoder('valhalla-FGIVMDg', {
//   layers: 'coarse'
// });
// geocoder.addTo(map);


map.getContainer().addEventListener('mousedown', function (event) {
  var latlng = map.mouseEventToLatLng(event);
  var pixel = { x: event.clientX, y: event.clientY };

  scene.getFeatureAt(pixel).then(function(selection) {
    console.log(selection);

  });
});



var searchScheme = [
  {
    codeValue: '범주를 선택해주세요'
  },
  {
    code: 'A3',
    codeValue: '법정동',
    category: './js/data-scheme/beobjung.json'
  },
  {
    code: 'A6',
    codeValue: '특수지',
    category: './js/data-scheme/special.json'
  },
  {
    code: 'A8',
    codeValue: '건축물용도',
    category: './js/data-scheme/usage.json'
  },
  {
    code: 'A10',
    codeValue: '건축물구조',
    category: './js/data-scheme/structure.json'
  },
  {
    code: 'A13',
    codeValue: '사용승인일자 (Date approved for use)',
    min: 19400101,
    max: 20170101,
    initialValue: '19800101',
    step: 10000,
    formatText: function(string) {
      return string[0] + string[1] + string[2] + string[3] + '년 이후';
    }
  },
  {
    code: 'A14',
    codeValue: '연면적',
    min: 50,
    max: 20000,
    initialValue: 3000,
    step: 100,
    formatText: function(string) {
      return string+'㎡';
    }
  },
  {
    code: 'A15',
    codeValue: '대지면적',
    min: 100,
    max: 10000,
    initialValue: 3000,
    formatText: function(string) {
      return string+'㎡';
    }
  },
  {
    code: 'A16',
    codeValue: '높이 (Height)',
    min: 1,
    max: 100,
    initialValue: 20,
    step: 2,
    formatText: function(string) {
      return string + 'm 이상';
    }
  },
  {
    code: 'A17',
    codeValue: '건폐율(Coverage ratio)',
    min: 1,
    max: 100,
    initialValue: 40,
    step: 5,
    formatText: function(string) {
      return string + '(%) 이상 ';
    }
  },
  {
    code: 'A18',
    codeValue: '용적율 (Floor area ratio)',
    min: 1,
    max: 300,
    initialValue: 50,
    step: 5,
    formatText: function(string) {
      return string + '이상 (%)';
    }
  }
];


// Put category selector on the map
var categoryLegend = L.control({position: 'topright'});

var rebuildTangram = function () {
  document.getElementById('loading').style.visibility = 'visible';
  scene.rebuild().then(function() {
    document.getElementById('loading').style.visibility = 'hidden';
  });
}


categoryLegend.onAdd = function(map) {

  var wrapperDiv = L.DomUtil.create('div', 'option-wrapper');

  var firstDropdownDiv = L.DomUtil.create('div', 'category first-option');
  firstDropdownDiv.id = 'firstDropdownWrapper';

  var secondDropdownDiv = L.DomUtil.create('div', 'category second-option');
  secondDropdownDiv.id = 'secondDropdownWrapper';


  var dropdown = L.DomUtil.create('select');
  var placeHolder = L.DomUtil.create('option');
  // placeHolder.innerHTML = '범주를 선택해주세요'
  // dropdown.append(placeHolder);

  for (var i = 0; i < searchScheme.length; i++) {
    var option = L.DomUtil.create('option');
    option.setAttribute('value', searchScheme[i].code);
    option.innerHTML = searchScheme[i].codeValue;
    dropdown.appendChild(option);
  }

  firstDropdownDiv.appendChild(dropdown);

  // Stop map events while users interacting with search
  wrapperDiv.onmousedown = wrapperDiv.ondblclick = wrapperDiv.onmousemove = L.DomEvent.stopPropagation;

  dropdown.onchange = function (e) {
    secondDropdownDiv.innerHTML = '';

    scene.config.global.key_text = dropdown.value;
    scene.config.global.value_text = '';
    rebuildTangram();

    if (searchScheme[dropdown.selectedIndex].category) {
      var request = new XMLHttpRequest();
      request.open('GET', searchScheme[dropdown.selectedIndex].category, true);

      request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
          // Success!
          var data = JSON.parse(this.response);
          var secondDropdown = L.DomUtil.create('select');
            // We reached our target server, but it returned an error
            secondDropdown.append(L.DomUtil.create('option'));
            for (var j = 0; j < data.length; j++) {
              var option = L.DomUtil.create('option');
              var optionValue = data[j]["코드값"] || data[j]["법정동코드"];
              var optionText = data[j]["코드값의미"] || data[j]["법정동명"];
              var isThisValid = data[j]["폐지여부"] && data[j]["폐지여부"] == "존재";

              option.setAttribute('value', optionValue);
              option.innerHTML = optionText;
              secondDropdown.appendChild(option);
            }
            secondDropdown.onchange = function (e) {
              scene.config.global.value_text = secondDropdown.value;
              rebuildTangram();
            }
            if (isThisValid !== false ) secondDropdownDiv.appendChild(secondDropdown);
        }
      }

      request.onerror = function() {
        // There was a connection error of some sort
      };

      request.send();
    } else {
      var slider = L.DomUtil.create('input');
      slider.setAttribute('type', 'range');
      slider.setAttribute('min', searchScheme[dropdown.selectedIndex].min);
      slider.setAttribute('max', searchScheme[dropdown.selectedIndex].max);
      slider.setAttribute('step', searchScheme[dropdown.selectedIndex].step);
      slider.setAttribute('value', parseInt(searchScheme[dropdown.selectedIndex].initialValue));
      secondDropdownDiv.appendChild(slider);
      var sliderValueDiv = L.DomUtil.create('div', 'value-text');
      secondDropdownDiv.appendChild(sliderValueDiv);
      sliderValueDiv.innerHTML = searchScheme[dropdown.selectedIndex].formatText(searchScheme[dropdown.selectedIndex].initialValue);
      scene.config.global.value_text = slider.value;

      rebuildTangram();

      // Disable map dragging while user interacting with the slider
      slider.onmousedown = function (e) {
        map.dragging.disable();
      }

      slider.onmouseup = function (e) {
        map.dragging.enable();
      }

      slider.onchange = function (e) {
        scene.config.global.value_text = slider.value;
        sliderValueDiv.innerHTML = searchScheme[dropdown.selectedIndex].formatText(slider.value);
        rebuildTangram();
      }
    }
  }

  wrapperDiv.appendChild(firstDropdownDiv);
  wrapperDiv.appendChild(secondDropdownDiv);

  return wrapperDiv;
}

categoryLegend.addTo(map);