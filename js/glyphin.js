//  GLYPHIN  GLYPHIN  GLYPHIN  GLYPHIN  GLYPHIN  GLYPHIN 
//
// Receives all the paths for a glyph and processes them in various ways
// 

(function() {

  const root                     = this || {} ;
  const proto                    = Glyphin.prototype;
  var codeList;

  if ( typeof module === 'object' && module.exports ) {
    module.exports               = Glyphin;
  } else {
    if ( typeof define === 'function' && define.amd ) {
      define ( 'Glyphin' , [], function() { return Glyphin } )
    } else {
      root.Glyphin               = Glyphin
    }
  }

  function Glyphin(font,ser){

    var glyphin                  = this,
        calibrate                = makeCalibrate(font.unitsPerEm),
        getCoord                 = makeGetCoord(calibrate),
        glyph                    = false,
        series                   = isArray(ser)?ser:[],
        glyphs                   = new Array(series.length),
        allGlyphs                = font.glyphs.glyphs,
        l                        = font.glyphs.length-1;

    codeList                     = MeshWriter().codeList;
    series.forEach(function(letter,ix){
      var i                      = -1;
      if ( typeof letter === "string" ) {
        letter                   = letter.charCodeAt(0)
      }
      while(l>i++){
        if(allGlyphs[i].unicode===letter){
          glyphs[ix]             = allGlyphs[i]
        }
      }
    })

    this.setGlyphIndex           = function(ix){
      var tempGlyph;
      if ( typeof ix === "number" ) {
        tempGlyph                = font.glyphs.glyphs[ix];
        if ( tempGlyph != null && typeof tempGlyph === "object" ) {
          glyph                  = tempGlyph;
          return "glyph set to '"+glyph.name+"'"
        }else{
          return "No glyph at that index"
        }
      }else{
        return "1 argument, index <number>"
      }
    };
    this.getGlyph                = function(){
      return glyph
    };
    this.getGlyphs               = function(){
      return glyphs
    };
    this.getCharacter            = function(){
      return String.fromCharCode(glyph.unicode)
    }
    this.convertCommands         = function(commands,width){
      return isArray(commands)?convertCommands(commands,width,calibrate,getCoord):null
    };
  };

  proto.getMeshWriterSeries      = function(compr){
    var glyphin                  = this,
        series                   = glyphin.getGlyphs(),
        result                   = "";
    series.forEach(function(glyph){
      glyphin.setGlyphIndex(glyph.index);
      result                     = result + glyphin.getMWGlyphText(compr)
    })
    return result
  };
  proto.getMWGlyphText           = function(compr){
    var objectified              = this.getMWGlyphObject();
    return objectified?this.formatObject(objectified,compr===true):null
  };
  proto.getMWGlyphObject         = function(){
    var organized                = this.getOrganized();
    return organized?this.objectifyOrganizedCommands(organized):null
  };
  proto.getOrganized             = function(){
    var converted                = this.getConverted();
    return converted?this.organizeConvertedCommands(converted):null
  };
  proto.getConverted             = function(){
    var glyph                    = this.getGlyph();
    return glyph?this.convertGlyph(glyph):null
  };
  proto.convertGlyph             = function(glyph){
    return isObject(glyph)?this.convertPath(glyph.path,glyph.advanceWidth):null
  };
  proto.convertPath              = function(path,width){
    return isPath(path)?this.convertCommands(path.commands,width):null
  };
  proto.organizeCommands         = function(commands,width){
    return isArray(commands)?convertCommands(commands,width):null
  };
  proto.objectifyOrganizedCommands = function(organized){
    var xMin                     = 10000,
        yMin                     = 10000,
        xMax                     = -10000,
        yMax                     = -10000,
        shapeCmds                = organized[0].map(ar=>ar[0]),
        holeCmds                 = organized[1].map(ar=>ar.map(arr=>arr[0])),
        width                    = organized.width
        o1                       = organized[1];
    organized[0].forEach(shapes=>shapes[1].forEach(limitPoint));
    if(isNotEmptyArray(o1[0])||isNotEmptyArray(o1[1])||isNotEmptyArray(o1[2])||isNotEmptyArray(o1[3])||isNotEmptyArray(o1[4])||isNotEmptyArray(o1[5])||isNotEmptyArray(o1[6])||isNotEmptyArray(o1[7])){
      return {
        shapeCmds,holeCmds,xMin,xMax,yMin,yMax,width
      }
    }else{
      return {
        shapeCmds,xMin,xMax,yMin,yMax,width
      }
    }
    function limitPoint(point){
      if(point[0]<xMin){xMin=point[0]}
      if(point[1]<yMin){yMin=point[1]}
      if(point[0]>xMax){xMax=point[0]}
      if(point[1]>yMax){yMax=point[1]}
    }
  };
  proto.organizeConvertedCommands= function(conv){
    var converted                = conv.slice(),
        reference                = conv.slice(),
        commandsArray            = [],
        holesArray               = [],
        maxIterations            = 16,
        result                   = [[],[]];
    result.width                 = conv.width;
    while(converted.length&&0<maxIterations--){
      let i                      = converted.length;
      while(0<i--){
        let path                 = converted[i];
        if(!inAnything(path)){
          commandsArray.push(path);
          holesArray.push([]);
          converted.splice(i,1)
        }else{
          let cmdIx              = inCommand(path);
          if(-1<cmdIx){
            holesArray[cmdIx].push(path);
            converted.splice(i,1)
          }
        }
      }
    }
    if(maxIterations){
      result[0]                  = commandsArray;
      result[1]                  = holesArray
    }else{
      console.log("Could not process commands series");
    }
    return result;

    function inAnything(path){
      var inSomething            = false;
      for(let i=0;i<reference.length;i++){
        if(reference[i]!==path){
          if(contains(reference[i],path)){inSomething=true}
        }
      }
      return inSomething
    }
    function inCommand(path){
      var inSomething            = false,
          ix                     = -1;
      for(let i=0;i<commandsArray.length&&!inSomething;i++){
        if(contains(commandsArray[i],path)){ix=i;inSomething=true}
      }
      return ix
    }
  };

  const preLabel    = "      ";
  const one         = " ";
  const two         = "  ";
  const four        = "    ";
  const postLabel   = "        ";
  const postShape   = "      ";
  const postHole    = "       ";
  const lf          = "\n";
  const colon       = ": ";
  const equals      = "= ";
  const comma       = ",";
  const openSquare  = "[";
  const closeSquare = "]";
  const openCurly   = "{";
  const closeCurly  = "};";
  const noLabel     = "         ";

  proto.formatObject             = function(glyphObj,compressed){
    var quote                    = this.getCharacter().charCodeAt(0)===34?"'":'"';
    if(glyphObj.holeCmds){
      return preLabel+'font['+quote+this.getCharacter()+quote+']'+postLabel+equals+openCurly+lf+
             preLabel+two+(compressed?"sC       ":"shapeCmds")+postShape+colon+openSquare+lf+
             stringifyShapeCmds(glyphObj.shapeCmds)+
             preLabel+noLabel+postLabel+two+closeSquare+comma+lf+
             preLabel+two+(compressed?"hC      ":"holeCmds")+postHole+colon+openSquare+lf+
             stringifyHoleCmds(glyphObj.holeCmds)+
             preLabel+noLabel+postLabel+two+closeSquare+comma+lf+
             preLabel+two+"xMin"+four+postHole+colon+glyphObj.xMin+comma+lf+
             preLabel+two+"xMax"+four+postHole+colon+glyphObj.xMax+comma+lf+
             preLabel+two+"yMin"+four+postHole+colon+glyphObj.yMin+comma+lf+
             preLabel+two+"yMax"+four+postHole+colon+glyphObj.yMax+comma+lf+
             preLabel+two+"width"+two+one+postHole+colon+glyphObj.width+lf+
             preLabel+closeCurly+lf
    }else{
      return preLabel+'font['+quote+this.getCharacter()+quote+']'+postLabel+equals+openCurly+lf+
             preLabel+two+(compressed?"sC       ":"shapeCmds")+postShape+colon+openSquare+lf+
             stringifyShapeCmds(glyphObj.shapeCmds)+
             preLabel+noLabel+postLabel+two+closeSquare+comma+lf+
             preLabel+two+"xMin"+four+postHole+colon+glyphObj.xMin+comma+lf+
             preLabel+two+"xMax"+four+postHole+colon+glyphObj.xMax+comma+lf+
             preLabel+two+"yMin"+four+postHole+colon+glyphObj.yMin+comma+lf+
             preLabel+two+"yMax"+four+postHole+colon+glyphObj.yMax+comma+lf+
             preLabel+two+"width"+two+one+postHole+colon+glyphObj.width+lf+
             preLabel+closeCurly+lf
    }

    function stringifyShapeCmds(cmds){
      var result  = ""
          convert = compressed ? function(x){return "'"+codeList(x)+"'"} : JSON.stringify;
      for(let i=0;i<cmds.length;i++){
        if(i===cmds.length-1){
          result = result + preLabel + noLabel + postLabel + four + convert(cmds[i]) + lf
        }else{
          result = result + preLabel + noLabel + postLabel + four + convert(cmds[i])+comma + lf 
        }
      }
      return result
    }

    function stringifyHoleCmds(cmds){
      var result   = ""
          convert  = compressed ? function(x){return "'"+codeList(x)+"'"} : JSON.stringify;
      for(let i=0;i<cmds.length;i++){
        if(i===cmds.length-1){
          result = result + preLabel + noLabel + postLabel + four + openSquare + superconvert(cmds[i]) + closeSquare + lf
        }else{
          result = result + preLabel + noLabel + postLabel + four + openSquare + superconvert(cmds[i]) + closeSquare + comma + lf 
        }
      }
      return result;

      function superconvert(cmds){
        var result = "";
        for(let i=0;i<cmds.length;i++){
          if(i===cmds.length-1){
            result = result+convert(cmds[i])
          }else{
            result = result+convert(cmds[i])+comma
          }
        }
        return result
      }
    }
  };

  return Glyphin;


  function convertCommands(commands,width,calibrate,getCoord){
    var len                    = commands.length-1,
        ix                     = -1,
        paths                  = [],
        path                   = [[],[]],
        lastX                  = NaN,
        lastY                  = NaN,
        zero                   = 0.001;
    paths.width                = calibrate(width);
    while(len>ix++){
      let command              = commands[ix],
          type                 = command.type;
      if(endPathType(type)){
        path.pip               = new PiP(path[1]);
        paths.push(path);
        path                   = [[],[]];
        lastX                  = NaN;
        lastY                  = NaN
      }
      if(moveType(type)||lineType(type)||qCurveType(type)||cCurveType(type)){
        extendPath(getCoord(command))
      }
    }
    return paths;

    function extendPath(coord){
      var thisX,thisY;
      if(coord.length){
        thisX                  = coord[coord.length-2],
        thisY                  = coord[coord.length-1];
        if ( !( coord.length===2 && thisX<lastX+zero && thisX>lastX-zero && thisY<lastY+zero && thisY>lastY-zero ) ) {
          lastX                = thisX;
          lastY                = thisY;
          path[0].push(coord);
          path[1].push([thisX,thisY])
        }
      }
    }
  };

  function contains(a,b){
    var i      = -1,
        c      = 0,
        l      = b[1]["length"]-1;
    while(l>i++){
      if(a.pip.isIn(b[1][i][0],b[1][i][1])){c++}
    }
    return c>l/2
  };

  //  ~  -  =  ~  -  =  ~  -  =  ~  -  =  ~  -  =  ~  -  =  
  function makeGetCoord(calibrate){
    return function getCoord(cmd){
      if ( typeof cmd.x2 === "number" ) {
        return [ calibrate(cmd.x1) , calibrate(cmd.y1) , calibrate(cmd.x2) , calibrate(cmd.y2) , calibrate(cmd.x) , calibrate(cmd.y) ]
      }else{
        if ( typeof cmd.x1 === "number" ) {
          return [ calibrate(cmd.x1) , calibrate(cmd.y1) , calibrate(cmd.x) , calibrate(cmd.y) ]
        }else{
          if ( typeof cmd.x === "number" ) {
            return [ calibrate(cmd.x) , calibrate(cmd.y) ]
          }else{
            return []
          }
        }
      }
    }
  };

  //  ~  -  =  ~  -  =  ~  -  =  ~  -  =  ~  -  =  ~  -  =  
  // All fonts are calibrated to 1000 unts per em
  function makeCalibrate(unitsPerEm){
    var floor                    = Math.floor,
        factor                   = floor( 0.01 + 1000000000 / unitsPerEm ) / 500000;
    console.log("Calibration factor = "+factor);
    return function calibrate(n){
      return Math.floor(0.000001+n*factor)/2
    }
  };
  function endPathType(t){return t==="Z"};
  function moveType(t){return t==="M"};
  function qCurveType(t){return t==="Q"};
  function cCurveType(t){return t==="C"};
  function lineType(t){return t==="L"};
  function isPath(p){  return Boolean(p) && ( typeof p === "object" ) && ( typeof  p.constructor === "function" ) && p.constructor.name === "Path" };
  function isArray(a){ return Boolean(a) && ( typeof a === "object" ) && (  a.constructor === Array ) };
  function isNotEmptyArray(a){ return Boolean(a) && ( typeof a === "object" ) && (  a.constructor === Array ) && Boolean ( a.length ) };
  function isObject(o){return Boolean(o) && ( typeof o === "object" ) };

}).call(this);
