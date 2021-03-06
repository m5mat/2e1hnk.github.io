/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Convert latitude/longitude <=> OS National Grid Reference points (c) Chris Veness 2005-2010   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/*
 * convert geodesic co-ordinates to OS grid reference
 */
function LatLongToOSGrid(p) {
  var lat = p.lat.toRad(), lon = p.lon.toRad();
  
  var a = 6377563.396, b = 6356256.910;          // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717;                         // NatGrid scale factor on central meridian
  var lat0 = (49).toRad(), lon0 = (-2).toRad();  // NatGrid true origin
  var N0 = -100000, E0 = 400000;                 // northing & easting of true origin, metres
  var e2 = 1 - (b*b)/(a*a);                      // eccentricity squared
  var n = (a-b)/(a+b), n2 = n*n, n3 = n*n*n;

  var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  var nu = a*F0/Math.sqrt(1-e2*sinLat*sinLat);              // transverse radius of curvature
  var rho = a*F0*(1-e2)/Math.pow(1-e2*sinLat*sinLat, 1.5);  // meridional radius of curvature
  var eta2 = nu/rho-1;

  var Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (lat-lat0);
  var Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(lat-lat0) * Math.cos(lat+lat0);
  var Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(lat-lat0)) * Math.cos(2*(lat+lat0));
  var Md = (35/24)*n3 * Math.sin(3*(lat-lat0)) * Math.cos(3*(lat+lat0));
  var M = b * F0 * (Ma - Mb + Mc - Md);              // meridional arc

  var cos3lat = cosLat*cosLat*cosLat;
  var cos5lat = cos3lat*cosLat*cosLat;
  var tan2lat = Math.tan(lat)*Math.tan(lat);
  var tan4lat = tan2lat*tan2lat;

  var I = M + N0;
  var II = (nu/2)*sinLat*cosLat;
  var III = (nu/24)*sinLat*cos3lat*(5-tan2lat+9*eta2);
  var IIIA = (nu/720)*sinLat*cos5lat*(61-58*tan2lat+tan4lat);
  var IV = nu*cosLat;
  var V = (nu/6)*cos3lat*(nu/rho-tan2lat);
  var VI = (nu/120) * cos5lat * (5 - 18*tan2lat + tan4lat + 14*eta2 - 58*tan2lat*eta2);

  var dLon = lon-lon0;
  var dLon2 = dLon*dLon, dLon3 = dLon2*dLon, dLon4 = dLon3*dLon, dLon5 = dLon4*dLon, dLon6 = dLon5*dLon;

  var N = I + II*dLon2 + III*dLon4 + IIIA*dLon6;
  var E = E0 + IV*dLon + V*dLon3 + VI*dLon5;

  //return [N, E];
  return gridrefNumToLet(E, N, 8);
}


/*
 * convert OS grid reference to geodesic co-ordinates
 */
function OSGridToLatLong(gridRef) {
  var gr = gridrefLetToNum(gridRef);
  var E = gr[0], N = gr[1];

  var a = 6377563.396, b = 6356256.910;              // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717;                             // NatGrid scale factor on central meridian
  var lat0 = 49*Math.PI/180, lon0 = -2*Math.PI/180;  // NatGrid true origin
  var N0 = -100000, E0 = 400000;                     // northing & easting of true origin, metres
  var e2 = 1 - (b*b)/(a*a);                          // eccentricity squared
  var n = (a-b)/(a+b), n2 = n*n, n3 = n*n*n;

  var lat=lat0, M=0;
  do {
    lat = (N-N0-M)/(a*F0) + lat;

    var Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (lat-lat0);
    var Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(lat-lat0) * Math.cos(lat+lat0);
    var Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(lat-lat0)) * Math.cos(2*(lat+lat0));
    var Md = (35/24)*n3 * Math.sin(3*(lat-lat0)) * Math.cos(3*(lat+lat0));
    M = b * F0 * (Ma - Mb + Mc - Md);                // meridional arc

  } while (N-N0-M >= 0.00001);  // ie until < 0.01mm

  var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  var nu = a*F0/Math.sqrt(1-e2*sinLat*sinLat);              // transverse radius of curvature
  var rho = a*F0*(1-e2)/Math.pow(1-e2*sinLat*sinLat, 1.5);  // meridional radius of curvature
  var eta2 = nu/rho-1;

  var tanLat = Math.tan(lat);
  var tan2lat = tanLat*tanLat, tan4lat = tan2lat*tan2lat, tan6lat = tan4lat*tan2lat;
  var secLat = 1/cosLat;
  var nu3 = nu*nu*nu, nu5 = nu3*nu*nu, nu7 = nu5*nu*nu;
  var VII = tanLat/(2*rho*nu);
  var VIII = tanLat/(24*rho*nu3)*(5+3*tan2lat+eta2-9*tan2lat*eta2);
  var IX = tanLat/(720*rho*nu5)*(61+90*tan2lat+45*tan4lat);
  var X = secLat/nu;
  var XI = secLat/(6*nu3)*(nu/rho+2*tan2lat);
  var XII = secLat/(120*nu5)*(5+28*tan2lat+24*tan4lat);
  var XIIA = secLat/(5040*nu7)*(61+662*tan2lat+1320*tan4lat+720*tan6lat);

  var dE = (E-E0), dE2 = dE*dE, dE3 = dE2*dE, dE4 = dE2*dE2, dE5 = dE3*dE2, dE6 = dE4*dE2, dE7 = dE5*dE2;
  lat = lat - VII*dE2 + VIII*dE4 - IX*dE6;
  var lon = lon0 + X*dE - XI*dE3 + XII*dE5 - XIIA*dE7;

  return new LatLon(lat.toDeg(), lon.toDeg());
}


/* 
 * convert standard grid reference ('SU387148') to fully numeric ref ([438700,114800])
 *   returned co-ordinates are in metres, centred on grid square for conversion to lat/long
 *
 *   note that northern-most grid squares will give 7-digit northings
 *   no error-checking is done on gridref (bad input will give bad results or NaN)
 */
function gridrefLetToNum(gridref) {
  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
  // shuffle down letters after 'I' since 'I' is not used in grid:
  if (l1 > 7) l1--;
  if (l2 > 7) l2--;

  // convert grid letters into 100km-square indexes from false origin (grid square SV):
  var e = ((l1-2)%5)*5 + (l2%5);
  var n = (19-Math.floor(l1/5)*5) - Math.floor(l2/5);

  // skip grid letters to get numeric part of ref, stripping any spaces:
  gridref = gridref.slice(2).replace(/ /g,'');

  // append numeric part of references to grid index:
  e += gridref.slice(0, gridref.length/2);
  n += gridref.slice(gridref.length/2);

  // normalise to 1m grid, rounding up to centre of grid square:
  switch (gridref.length) {
    case 6: e += '50'; n += '50'; break;
    case 8: e += '5'; n += '5'; break;
    // 10-digit refs are already 1m
  }

  return [e, n];
}


/*
 * convert numeric grid reference (in metres) to standard-form grid ref
 */
function gridrefNumToLet(e, n, digits) {
  // get the 100km-grid indices
  var e100k = Math.floor(e/100000), n100k = Math.floor(n/100000);
  
  if (e100k<0 || e100k>6 || n100k<0 || n100k>12) return '';

  // translate those into numeric equivalents of the grid letters
  var l1 = (19-n100k) - (19-n100k)%5 + Math.floor((e100k+10)/5);
  var l2 = (19-n100k)*5%25 + e100k%5;

  // compensate for skipped 'I' and build grid letter-pairs
  if (l1 > 7) l1++;
  if (l2 > 7) l2++;
  var letPair = String.fromCharCode(l1+'A'.charCodeAt(0), l2+'A'.charCodeAt(0));

  // strip 100km-grid indices from easting & northing, and reduce precision
  e = Math.floor((e%100000)/Math.pow(10,5-digits/2));
  n = Math.floor((n%100000)/Math.pow(10,5-digits/2));

  var gridRef = letPair + e.padLZ(digits/2) + n.padLZ(digits/2);

  return gridRef;
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/*
 * extend Number object with methods for converting degrees/radians
 */
Number.prototype.toRad = function() {  // convert degrees to radians
  return this * Math.PI / 180;
}
Number.prototype.toDeg = function() {  // convert radians to degrees (signed)
  return this * 180 / Math.PI;
}

/*
 * pad a number with sufficient leading zeros to make it w chars wide
 */
Number.prototype.padLZ = function(w) {
  var n = this.toString();
  for (var i=0; i<w-n.length; i++) n = '0' + n;
  return n;
}

function LatLon(lat, lon, height) {
  if (arguments.length < 3) height = 0;
  this.lat = lat;
  this.lon = lon;
  this.height = height;
}
 
 
 
// extend String object with method for parsing degrees or lat/long values to numeric degrees
//
// this is very flexible on formats, allowing signed decimal degrees, or deg-min-sec suffixed by 
// compass direction (NSEW). A variety of separators are accepted (eg 3º 37' 09"W) or fixed-width 
// format without separators (eg 0033709W). Seconds and minutes may be omitted. (Minimal validation 
// is done).
 
String.prototype.parseDeg = function() {
  if (!isNaN(this)) return Number(this);                 // signed decimal degrees without NSEW
 
  var degLL = this.replace(/^-/,'').replace(/[NSEW]/i,'');  // strip off any sign or compass dir'n
  var dms = degLL.split(/[^0-9.]+/);                     // split out separate d/m/s
  for (var i in dms) if (dms[i]=='') dms.splice(i,1);    // remove empty elements (see note below)
  switch (dms.length) {                                  // convert to decimal degrees...
    case 3:                                              // interpret 3-part result as d/m/s
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; break;
    case 2:                                              // interpret 2-part result as d/m
      var deg = dms[0]/1 + dms[1]/60; break;
    case 1:                                              // decimal or non-separated dddmmss
      if (/[NS]/i.test(this)) degLL = '0' + degLL;       // - normalise N/S to 3-digit degrees
      var deg = dms[0].slice(0,3)/1 + dms[0].slice(3,5)/60 + dms[0].slice(5)/3600; break;
    default: return NaN;
  }
  if (/^-/.test(this) || /[WS]/i.test(this)) deg = -deg; // take '-', west and south as -ve
  return deg;
}

// ellipse parameters
var e = { WGS84:    { a: 6378137,     b: 6356752.3142, f: 1/298.257223563 },
          Airy1830: { a: 6377563.396, b: 6356256.910,  f: 1/299.3249646   } };
 
// helmert transform parameters
var h = { WGS84toOSGB36: { tx: -446.448,  ty:  125.157,   tz: -542.060,   // m
                           rx:   -0.1502, ry:   -0.2470,  rz:   -0.8421,  // sec
                           s:    20.4894 },                               // ppm
          OSGB36toWGS84: { tx:  446.448,  ty: -125.157,   tz:  542.060,
                           rx:    0.1502, ry:    0.2470,  rz:    0.8421,
                           s:   -20.4894 } };
 
                 
function convertOSGB36toWGS84(p1) {
  var p2 = convert(p1, e.Airy1830, h.OSGB36toWGS84, e.WGS84);
  return p2;
}
 
 
function convertWGS84toOSGB36(p1) {
  var p2 = convert(p1, e.WGS84, h.WGS84toOSGB36, e.Airy1830);
  return p2;
}

function convert(p, e1, t, e2) {
  // -- convert polar to cartesian coordinates (using ellipse 1)
  
  p1 = new LatLon(p.lat, p.lon, p.height);  // to avoid modifying passed param
  p1.lat = p.lat.toRad(); p1.lon = p.lon.toRad(); 
 
  var a = e1.a, b = e1.b;
 
  var sinPhi = Math.sin(p1.lat), cosPhi = Math.cos(p1.lat);
  var sinLambda = Math.sin(p1.lon), cosLambda = Math.cos(p1.lon);
  var H = p1.height;
 
  var eSq = (a*a - b*b) / (a*a);
  var nu = a / Math.sqrt(1 - eSq*sinPhi*sinPhi);
 
  var x1 = (nu+H) * cosPhi * cosLambda;
  var y1 = (nu+H) * cosPhi * sinLambda;
  var z1 = ((1-eSq)*nu + H) * sinPhi;
 
 
  // -- apply helmert transform using appropriate params
  
  var tx = t.tx, ty = t.ty, tz = t.tz;
  var rx = t.rx/3600 * Math.PI/180;  // normalise seconds to radians
  var ry = t.ry/3600 * Math.PI/180;
  var rz = t.rz/3600 * Math.PI/180;
  var s1 = t.s/1e6 + 1;              // normalise ppm to (s+1)
 
  // apply transform
  var x2 = tx + x1*s1 - y1*rz + z1*ry;
  var y2 = ty + x1*rz + y1*s1 - z1*rx;
  var z2 = tz - x1*ry + y1*rx + z1*s1;
 
 
  // -- convert cartesian to polar coordinates (using ellipse 2)
 
  a = e2.a, b = e2.b;
  var precision = 4 / a;  // results accurate to around 4 metres
 
  eSq = (a*a - b*b) / (a*a);
  var p = Math.sqrt(x2*x2 + y2*y2);
  var phi = Math.atan2(z2, p*(1-eSq)), phiP = 2*Math.PI;
  while (Math.abs(phi-phiP) > precision) {
    nu = a / Math.sqrt(1 - eSq*Math.sin(phi)*Math.sin(phi));
    phiP = phi;
    phi = Math.atan2(z2 + eSq*nu*Math.sin(phi), p);
  }
  var lambda = Math.atan2(y2, x2);
  H = p/Math.cos(phi) - nu;
 
  return new LatLon(phi.toDeg(), lambda.toDeg(), H);
}

function ll2osg(lat, lon) {
  lat = lat.parseDeg();
  lon = lon.parseDeg();
  pWGS = new LatLon(lat, lon);
  pOSGB = convertWGS84toOSGB36(pWGS);
  return LatLongToOSGrid(pOSGB);
}