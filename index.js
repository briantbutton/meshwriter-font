/*!
 * Babylon MeshWriter-Font
 * https://github.com/BabylonJS/Babylon.js
 * (c) 2018-2019 Brian Todd Button
 * Released under the MIT license
 */
(function(){
  const opentype                 = require("./opentype/opentype");
  const PiP                      = require("./js/pip");
  const MeshWriter               = require("./js/meshwriter");
  const Glyphin                  = require("./js/glyphin");
  const config                   = require("./config");
  const fs                       = require("fs");
  const root                     = this;

  global.PiP                     = PiP;

  // *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-*
  // The command function

  global.convertFontFile         = function(opt){
    const options                = opt && typeof opt === "object" ? opt : {};
    const suffix                 = opt.suffix;
    const name                   = opt.name;
    const dd                     = opt.dir;
    const sd                     = opt.subdir;
    const compress               = opt.compress === true;
    const subdir                 = typeof  sd === "string" &&  sd.length>1 ?  sd+"/" : "";
    const dir                    = typeof  dd === "string" &&  dd.length>1 ?  dd+"/" : "";
    const coverage               = typeof config.coverage === "object" ? config.coverage : ["0","1","2","3","4","5","6","7","8","9"];

    if(!arguments.length){
      return "arguments:  suffix , filename [ directory [ subdirectory ] ] "
    }else{
      fs.readFile(config.relPathFrom+name+"."+suffix,onReadFile)
    }

    function onReadFile(err,data){
      if(err){
        console.log("Could not read from '"+config.relPathFrom+name+"."+suffix+"'");
        console.log(err)
      }else{
        let fontName;
        const fontArrayBuffer  = convertBuff2AB(data);
        const nativeFont       = opentype.parse(fontArrayBuffer,{lowMemory:false});
        const glyphin          = new Glyphin(nativeFont,coverage);
        let fileText           = glyphin.getMeshWriterSeries(compress);
        try{
          fontName             = nativeFont.names.fontFamily.en;
        }catch(e){
          fontName             = "font"
        }
        fileText               = filePre(fontName,nativeFont.outlinesFormat)+fileText+filePost(fontName);
        const fileBuffer       = Buffer.from(fileText);
        fs.writeFile(config.relPathTo+name.toLowerCase()+"."+"js",fileBuffer,onWriteFile)
      }
    };
    function onWriteFile(err){
      if(err){
        console.log("Could not write to '"+config.relPathTo+name+"."+"js"+"'");
        console.log(err)
      }else{
        console.log("Wrote MeshWriter font file to '"+config.relPathTo+name.toLowerCase()+"."+"js"+"'")
      }
    }
  };

  function convertBuff2AB(buff){
    var ab                     = new ArrayBuffer(buff.length),
        vw                     = new Uint8Array(ab);
    for ( var i = 0; i < buff.length; i++ ) { vw[i] = buff[i] }
    return ab
  };
  function filePre(fontName,format){
    let line1                  = "//  "+fontName.toUpperCase()+"  "+fontName.toUpperCase()+"  "+fontName.toUpperCase()+"\n// \n\n";
    if(format==="cff"){
      return line1+"define(\n  [],\n  function(){\n\n    return function(codeList){\n\n      var font={reverseHoles:true,reverseShapes:false},nbsp='\u00A0';\n\n"
    }else{
      return line1+"define(\n  [],\n  function(){\n\n    return function(codeList){\n\n      var font={reverseHoles:false,reverseShapes:true},nbsp='\u00A0';\n\n" 
    }
  };
  function filePost(){
    return "\n      return font;\n    }\n  }\n);\n"
  }
}).call(this);
