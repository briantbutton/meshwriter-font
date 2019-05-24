//  PIP  PIP  PIP  PIP  PIP  PIP  PIP  PIP  PIP  PIP  PIP 
//
// Point in polygon
// 

(function() {

  const root                     = this || {} ;
  const zero                     = 0.000001 ;

  if ( typeof module === 'object' && module.exports ) {
    module.exports               = PiP;
  } else {
    if ( typeof define === 'function' && define.amd ) {
      define ( 'PiP' , [], function() { return PiP } )
    } else {
      root.PiP                   = PiP
    }
  }

  function PiP(poly){
    var pip                      = this,
        first                    = poly[0],
        last                     = poly[poly.length-1],
        polygon                  = first[0]<last[0]+zero && first[0]>last[0]-zero && first[1]<last[1]+zero && first[1]>last[1]-zero ? poly.slice(1) : poly.slice(0) , 
        constant                 = new Array(polygon.length),
        multiple                 = new Array(polygon.length),
        polyY                    = polygon.map(d=>d[0]),
        polyX                    = polygon.map(d=>d[1]);
        precalcValues();

    this.isIn                    = function(y,x){
      var len                    = polygon.length ,
          lead                   = 0 ,
          follow                 = len - 1 , 
          oddNodes               = false , flag;

      for (lead=0; lead<len; lead++) {
        if ( (polyY[lead] < y && polyY[follow] >= y) || (polyY[follow] < y && polyY[lead] >= y ) ) {
          flag = (y*multiple[lead]+constant[lead])<x;
          oddNodes               = flag?oddNodes:!oddNodes;
        }
        follow                   = lead
      }
      return oddNodes
    };

    function precalcValues(){
      var len                    = polygon.length ,
          lead                   = 0 ,
          follow                 = len - 1 ;

      for(lead=0; lead<len; lead++) {
        if( polyY[follow] - polyY[lead] < zero && polyY[lead] - polyY[follow] < zero ) {
          constant[lead] = polyX[lead];
          multiple[lead] = 0
        }else{
          constant[lead] = polyX[lead]-(polyY[lead]*polyX[follow])/(polyY[follow]-polyY[lead])+(polyY[lead]*polyX[lead])/(polyY[follow]-polyY[lead]);
          multiple[lead] = (polyX[follow]-polyX[lead])/(polyY[follow]-polyY[lead])
        }
        follow=lead
      }
    }
  };
  return PiP;

}).call(this);
