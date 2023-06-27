Math.clamp = function (min, value, max) {
  return (value < min) ? min : (max < value) ? max : value;
};

function remtoPx(rem) {    
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function pxToRem(px) {    
  return px / parseFloat(getComputedStyle(document.documentElement).fontSize);
}

/*
tagname: string
options: Object
   quantity : number
   classes : string
   id : string
   text : string
   data : Object
   vars : Object
   style : Object
   prependTo : DOMElement
   appendTo : DOMElement
   extend : boolean
*/

function newEl(tagName, options = {}) {
  let count = (options.quantity) ? options.quantity : 1;
  let element = []; // Replaced with a single item if quantity is 1
  let child;
  for (let c = 0; c < count; c++) {
    child = document.createElement(tagName);
    if (options.classes) child.className = options.classes;
    if (options.id) child.id = options.id;
    if (options.text) child.innerHTML = options.text;
    if (options.data) {
      for (let d in options.data) {
        child.setAttribute('data-' + d, options.data[d]);
      }
    }
    if (options.vars) {
      for (let v in options.vars) {
        child.style.setProperty('--' + v, options.vars[v]);
      }
    }
    if (options.style) {
      for (let s in options.style) {
        child.style[s] = options.style[s];
      }
    }
    if (options.prependTo) {
      options.prependTo.prepend(child)
    } else if (options.appendTo) {
      options.appendTo.append(child);
    }
    if (count == 1) {
      element = child;
    } else {
      element.push(child);
    }
    if (options.extend) {
      extend(element);
    }
  }
  return element;
}

function extend(el) {
  el.setData = function (dataName, value) {
    this.setAttribute('data-' + dataName, value);
  };
  el.getData = function (dataName) {
    return this.getAttribute('data-' + dataName);
  };
  el.getNumData = function (dataName) {
    let value = this.getData(dataName);
    value = parseFloat(value);
    if (isNaN(value)) {
      console.log(`The attribute data-${varName} could not be coerced to a numeric value`);
    }
    return value;
  };
  el.setVar = function (varName, value) {
    varName = '--' + varName;
    this.style.setProperty(varName, value);
  };
  el.getVar = function (varName) {
    let value = '';
    varName = '--' + varName;
    value = this.style.getPropertyValue(varName);
    // Variables defined in a stylesheet are not accessible through this
    if (value == '') {
      value = window.getComputedStyle(this).getPropertyValue(varName);
      if (value != '') this.style.setProperty(varName, value);
    }
    return value;
  };
  el.getNumVar = function (varName) {
    let value = this.getVar(varName);
    value = parseFloat(value);
    if (isNaN(value)) {
      console.log(`The CSS variable ${varName} could not be coerced to a numeric value`);
    }
    return value;
  };
  return el;
}

function boxUp(tag, from, to, forEvery = false) {
  // Iterates through a node and moves every child of a certain tag into another node
  // Doing this in reverse because I'm not sure if removing nodes from children is going to 
  // pull the rug out from underneath the iterator index so to say
  let childCount = from.children.length;
  let boxedElements = [];
  for (let c = childCount - 1; c >= 0; c--) {
    let child = from.children[c];
    if (child.tagName == tag) {
      if (forEvery) forEvery(child, c);
      to.prepend(child);
      boxedElements.unshift(child);
    } else {
      c--;
    }
  }
  return boxedElements;
}

function bodyState(className, state) {
  let newState = !(document.body.classList.contains(className));
  if (typeof state !== 'undefined') {
    newState = state;
  }
  if (newState) {
    console.log(`adding ${className} to body`);
    document.body.classList.add(className);
  } else {
    console.log(`removing ${className} from body`);
    document.body.classList.remove(className);
  }
}

function getResource(uri, qs, cb) {
  const req = new XMLHttpRequest();

  req.open('POST', 'https://styleeyescreative.com' + uri, true);
  req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  req.responseType = 'document';
  req.send(qs);

  req.onreadystatechange = _ => {
    switch (req.readyState) {
      case 0: //(uninitialized) or (request not initialized)
        break;
      case 1: //(loading) or (server connection established)
        console.log('1. server connection established');
        break;
      case 2: //(loaded) or (request received)
        console.log('2. request received');
        break;
      case 3: //(interactive) or (processing request)
        console.log('3. processing request');
        break;
      case 4: //(complete) or (request finished and response is ready)
        // Process the server response here.
        console.log(`Status ${req.status} ${req.statusText}`);
        switch (req.status) {
          case 200:
            console.log(req.getAllResponseHeaders());
            cb(req.responseXML.body.children[0]);
            break;
          default:
            console.log('Request status is not 200');
        }
        break;
      default:
        console.log('What? That was definitely not a valid ready state: ' + res.readyState);
    }
  }
}

/*
oopsAllCubicBezierCurves [WIP]
Accepts a SVG path data string (the "d" attribute) and parses it piece by piece, converting the commands to curves.

let data = 'm537.544,99.799c36.912,63.934,34.408,139.808.029,199.484L230.4,831.385l220.8,382.437-115.2,199.532L0,831.385,480,0l57.544,99.799Z';
let d = 0;
*/
function oopsAllCubicBezierCurves(data) {
  let pos = [0, 0]; // Position of current point
  let d = 1; // Cursor position equal to the number of characters that precede the cursor
  let newData = '';

  let parseNumbers = start => {
    d = start;
    const isNumeric = /[-0-9.,]/;
    let notEnd = true,
    notCommand = true,
    decimal = false,
    minus = false,
    currentNumber = '',
    numbers = [];
    do {
      let digit = data.substring(d, ++d);
      console.log('DIGIT ' + digit);
      if (isNumeric.test(digit)) {
        if ((digit == '-' && minus) || 
            (digit == '.' && decimal) ||
            (digit == ',')) notEnd = false;
        if (digit == '-') minus = true;
        if (digit == '.') decimal = true;
      } else {
        notEnd = false;
        notCommand = false;
      }
      if (notEnd) {
        currentNumber += digit;
      } else {
        console.log('PARSE ' + currentNumber);
        numbers.push(parseFloat(currentNumber));
        currentNumber = '';
        notEnd = true;
        decimal = false;
        minus = false;
      }
    } while (notCommand);
    return numbers;
  };

  let tuplets = (size, numbers, formatTuplets) => {
    let formattedTuplets = '';
    for (let t = 0; t < numbers.length / size; t += size) {
      let tup = numbers.splice(0, size);
      formattedTuplets += formatTuplets(tup);
    }
    return formattedTuplets;
  };

  do {
    let char = data.substring(d - 1, d);
    let numbers = parseNumbers(d);
    switch (char) {
      case 'M':
      case 'm':
        pos = numbers.slice(0, 2);
        newData += 'M' + pos.join(',') + 'C';
        break;
      case 'L':
        pos = numbers.slice(numbers.length - 3, numbers.length - 1);
        newData += tuplets(2, numbers, tup => {
          return `,${pos.join(',')},${tup.join(',')},${tup.join(',')}`;
        });
        break;
      case 'l':
        numbers = numbers.slice(0, 2);

        numbers[0] += pos[0];
        numbers[1] += pos[1];
        newData += 'C' + pos.join(',') + ',' + numbers.join(',') + ',' + numbers.join(',') + ',';
        pos = numbers;
        break;
      case 'H':
        numbers = [numbers[0], pos[1]];
        newData += 'C' + pos.join(',') + ',' + numbers.join(',') + ',' + numbers.join(',') + ',';
        pos = numbers;
        break;
      case 'h':
        numbers = [pos[0] + numbers[0], pos[1]];
        newData += 'C' + pos.join(',') + ',' + numbers.join(',') + ',' + numbers.join(',');
        pos = numbers;
        break;
      case 'V':
        numbers = [pos[0], numbers[1]];
        newData += 'C' + pos.join(',') + ',' + numbers.join(',') + ',' + numbers.join(',');
        pos = numbers;
        break;
      case 'v':
        numbers = [pos[0], pos[1] + numbers[1]];
        newData += 'C' + pos.join(',') + ',' + numbers.join(',') + ',' + numbers.join(',');
        pos = numbers;
        break;
      case 'C':
        newData += 'C' + numbers.join(',');
        pos = numbers;
        break;
      case 'c':
        break;
      case 'S':
        break;
      case 's':
        break;
      case 'Q':
        break;
      case 'q':
        break;
      case 'T':
        break;
      case 't':
        break;
      case 'Z':
      case 'z':
        break;
      default:
        console.log(`Path command ${char} not recognized!`);
    };
  } while (d < data.length);
}