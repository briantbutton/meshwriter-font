//  GLYPHIN  GLYPHIN  GLYPHIN  GLYPHIN  GLYPHIN  GLYPHIN 
//
// Receives all the paths for a glyph and processes them in various ways
// 

(function() {

  const root                     = this || {} ;
  const proto                    = Glyphin.prototype;

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
    }
    this.getCharacter            = function(){
      return String.fromCharCode(glyph.unicode)
    }
    this.convertCommands         = function(commands,width){
      return isArray(commands)?convertCommands(commands,width):null
    };
    function convertCommands(commands,width){
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
          if ( !( coord.length === 2 && thisX<lastX+zero && thisX>lastX-zero && thisY<lastY+zero && thisY>lastY-zero ) ) {
            lastX                = thisX;
            lastY                = thisY;
            path[0].push(coord);
            path[1].push([thisX,thisY])
          }
        }
      }
    }
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
        holesArray               = []
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

  proto.formatObject             = function(glyphObj,compressed){
    let preLabel    = "      ";
    let one         = " ";
    let two         = "  ";
    let four        = "    ";
    let postLabel   = "        ";
    let postShape   = "      ";
    let postHole    = "       ";
    let lf          = "\n";
    let colon       = ": ";
    let equals      = "= ";
    let comma       = ",";
    if(glyphObj.holeCmds){
      return preLabel+'font["'+this.getCharacter()+'"]'+postLabel+equals+"{"+lf+
             preLabel+two+"shapeCmds"+postShape+colon+"["+lf+
             stringifyShapeCmds(glyphObj.shapeCmds)+
             preLabel + "         " + postLabel + two + "]" +lf+
             preLabel+two+"holeCmds"+postHole+colon+"["+lf+
             stringifyHoleCmds(glyphObj.holeCmds)+
             preLabel + "         " + postLabel + two + "]" +lf+
             preLabel+two+"xMin"+four+postHole+colon+glyphObj.xMin+comma+lf+
             preLabel+two+"xMax"+four+postHole+colon+glyphObj.xMax+comma+lf+
             preLabel+two+"yMin"+four+postHole+colon+glyphObj.yMin+comma+lf+
             preLabel+two+"yMax"+four+postHole+colon+glyphObj.yMax+comma+lf+
             preLabel+two+"width"+two+one+postHole+colon+glyphObj.width+lf+
             preLabel+"};"+lf
    }else{
      return preLabel+'font["'+this.getCharacter()+'"]'+postLabel+equals+"{"+lf+
             preLabel+two+"shapeCmds"+postShape+colon+JSON.stringify(glyphObj.shapeCmds)+comma+lf+
             preLabel+two+"xMin"+four+postHole+colon+glyphObj.xMin+comma+lf+
             preLabel+two+"xMax"+four+postHole+colon+glyphObj.xMax+comma+lf+
             preLabel+two+"yMin"+four+postHole+colon+glyphObj.yMin+comma+lf+
             preLabel+two+"yMax"+four+postHole+colon+glyphObj.yMax+comma+lf+
             preLabel+two+"width"+two+one+postHole+colon+glyphObj.width+lf+
             preLabel+"};"+lf
    }

    function stringifyShapeCmds(cmds){
      var result = "";
      for(let i=0;i<cmds.length;i++){
        if(i===cmds.length-1){
          result = result + preLabel + "         " + postLabel + four + JSON.stringify(cmds[i]) + lf
        }else{
          result = result + preLabel + "         " + postLabel + four + JSON.stringify(cmds[i])+comma + lf 
        }
      }
      return result
    }
    function stringifyHoleCmds(cmds){
      var result = "";
      for(let i=0;i<cmds.length;i++){
        if(i===cmds.length-1){
          result = result + preLabel + "         " + postLabel + four + JSON.stringify(cmds[i]) + lf
        }else{
          result = result + preLabel + "         " + postLabel + four + JSON.stringify(cmds[i])+comma + lf 
        }
      }
      return result
    }
  };


  return Glyphin;



  function contains(a,b){
    var i      = -1,
        c      = 0,
        l      = b[1]["length"]-1;
    while(l>i++){
      if(a.pip.isIn(b[1][i][0],b[1][i][1])){c++}
    }
    return c>l/2
  };
          lastY                  = NaN,
          zero                   = 0.001;
  var testitalicPercent          = {
          shapeCmds              : [
                                     [[214,370],[151,370,108,404.5],[65,439,51.5,476],[38,513,38,545],[38,622,90.5,671],[143,720,214,720],[290,720,340,668.5],[390,617,390,545],[390,481,355,439],[320,397,283,383.5],[246,370,214,370]],
                                     [[667,712],[217,-31],[165,-4],[616,739],[667,712]],
                                     [[619,-12],[556,-12,513,22.5],[470,57,456.5,94],[443,131,443,163],[443,227,478,269],[513,311,550,324.5],[587,338,619,338],[682,338,725,303.5],[768,269,781.5,232],[795,195,795,163],[795,99,760,57],[725,15,688,1.5],[651,-12,619,-12]]
                                   ],
          holeCmds               : [
                                      [
                                         [[214,430],[264,430,297,464.5],[330,499,330,545],[330,595,295.5,627.5],[261,660,214,660],[164,660,131,625.5],[98,591,98,545],[98,495,132.5,462.5],[167,430,214,430]]
                                      ],
                                      [],
                                      [
                                         [[619,48],[669,48,702,82.5],[735,117,735,163],[735,213,700.5,245.5],[666,278,619,278],[569,278,536,243.5],[503,209,503,163],[503,113,537.5,80.5],[572,48,619,48]]
                                      ]
                                   ]
  };
  var testitalicB                = {
          shapeCmds              : [
                                     [[304,0],[94,0],[94,708],[305,708],[415,708,474,660],[533,612,533,527],[533,471,499,429.5],[465,388,408,375],[408,373],[477,365,522.5,319.5],[568,274,568,196],[568,105,496,52.5],[424,0,304,0]]
                                   ],
          holeCmds               : [
                                      [
                                         [[166,339],[166,62],[300,62],[398,62,446.5,100.5],[495,139,495,200],[495,270,447.5,304.5],[400,339,313,339],[166,339]],
                                         [[166,646],[166,398],[311,398],[382,398,421.5,431.5],[461,465,461,522],[461,583,416,614.5],[371,646,291,646],[166,646]]
                                      ]
                                   ]
  };
  var textChinese9300            = {
    shapeCmds                    : [
                                      [[567,-22],[622,7],[663,-46.5,694,-96.5],[633.5,-128.5],[606,-78,567,-22]],
                                      [[320,-17.5],[378.5,7],[414,-50.5,440,-104.5],[375.5,-131.5],[353.5,-77,320,-17.5]],
                                      [[831,-17.5],[883.5,18],[934.5,-38,976.5,-93.5],[918.5,-134.5],[882.5,-78,831,-17.5]],
                                      [[131.5,20.5],[188,-13.5],[140.5,-80,87.5,-139.5],[34,-97.5],[87.5,-43.5,131.5,20.5]],
                                      [[625.5,526.5],[625.5,762],[696,762],[696,526.5],[625.5,526.5]],
                                      [[835.5,812],[906,812],[906,511],[905,423,811.5,421],[754.5,419,670.5,421],[665,455.5,657,490.5],[739,485.5,783,485.5],[835.5,485.5,835.5,537.5],[835.5,812]],
                                      [[67,263],[218.5,327.5,322,411.5],[273,411.5],[273,553],[192,472,69,408.5],[46.5,436,23,463],[166,524.5,253.5,605.5],[56.5,605.5],[56.5,661.5],[273,661.5],[273,729.5],[180.5,726,88.5,723],[86.5,730.5,76,777.5],[312,784.5,517.5,799],[529,743.5],[434.5,737.5,341.5,732.5],[341.5,661.5],[551.5,661.5],[551.5,605.5],[341.5,605.5],[341.5,561],[372,591],[459.5,548,547.5,502],[508.5,452.5],[428.5,497.5,341.5,543],[341.5,427],[357,441.5,373,456.5],[456,456.5],[431.5,430,405,405.5],[728.5,405.5],[728.5,358.5],[673.5,297],[856,297],[856,20],[161,20],[161,235.5],[135.5,223,110,210],[90.5,238.5,67,263]]
                                   ],
    holeCmds                     : [
                                      [],
                                      [],
                                      [],
                                      [],
                                      [],
                                      [],
                                      [
                                         [[226.5,134],[226.5,70.5],[475.5,70.5],[475.5,134],[226.5,134]],
                                         [[790,183],[790,246.5],[541,246.5],[541,183],[790,183]],
                                         [[541,70.5],[790,70.5],[790,134],[541,134],[541,70.5]],
                                         [[226.5,246.5],[226.5,183],[475.5,183],[475.5,246.5],[226.5,246.5]],
                                         [[596.5,297],[646,356.5],[347.5,356.5],[309.5,325.5,264.5,297],[596.5,297]]
                                      ]
                                   ],
    xMin                         : 23,
    xMax                         : 976.5,
    yMin                         : -139.5,
    yMax                         : 812,
    width                        : 999.5
  };
  foo="https://www.babylonjs-playground.com/#NLG6KE";
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
  function makeCalibrate(unitsPerEm){
    var floor                    = Math.floor,
        factor                   = floor( 0.01 + 1000000000 / unitsPerEm ) / 500000;
    console.log("Factor = "+factor);
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
