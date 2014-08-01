// ==UserScript==
// @name            Ipernity 2 Yahoo/Flickr (1 photo)
// @description     Moves a photo from ipernity to Yahoo/Flickr
// @include         http://www.ipernity.com/doc/*
// @include         http://ipernity.com/doc/*
// @include         http://iol.ipernity.dev/doc/*
// @grant           GM_xmlhttpRequest
// ==/UserScript==

// --------------------------------------------------------------------
//
// This is a Greasemonkey user script.
//
// To install, you need FireFox  http://www.mozilla.org/firefox and the 
// firefox extension called Greasemonkey: http://www.greasespot.net/
// Install the Greasemonkey extension then restart Firefox and revisit this script.
// There should now be a button at the top of the screen saying "Install User Script".
// Click it and accept the default configuration and install.
//
// To uninstall, go to Tools/Manage User Scripts,
// select "iper2flickr_1photo", and click Uninstall.
//
// Thanks to :
// - http://gdorn.nudio.net/greasemonkey
// - http://www.ipernity.com/home/14353 (Michael)
//
// --------------------------------------------------------------------

/*
  ChangeLog
  =========
  v0.9  25-July-2007 : juste a demo - uploading by Url is not proposed by Flickr

*/

(function() {

   var about = {'name':'Flickr 1 Photo importer', 
	       'version':1.4, 
	       'check'   : '/E/Greasemonkey/flickr.1photo.version',
	       'updates' : '/apps/gm' };

  function _gt(e) { return document.getElementsByTagName(e); }
  function _ge(e) { return document.getElementById(e); }
  function _ce(e) { return document.createElement(e); }
  function _ct(e) { return document.createTextNode(e); }
  function _pi(e) { return parseInt(e); };
  function _pf(e) { return parseFloat(e); };
  
  if(unsafeWindow) w = unsafeWindow;
  else w = window;
  
  var user_id = w.glob_user_id;
  var doc_id  = w.doc_id;
  var isyou   = w.isyou;
  var photo   = {};

  if ( ! isyou || ! doc_id ) return;

  // check_session

  check_session();

   // create Div

  var div = document.createElement("DIV");
  div.id = "iol_import";
  div.style.width="518px";
  div.style.border="solid 1px #ccc";
  div.style.backgroundColor="#f7f7f7";
  div.style.padding="5px 20px";
  div.style.margin="3px 0";

  var here = _ge('photo_container');

  here.parentNode.insertBefore(div, here.nextSibling);
    
  div.innerHTML="loading photo infos...";

  // useful funcs

  function fix_perm(p)  { p=_pi(p); var f = {15:3, 7:2, 3:1 }; return (f[p])? f[p]:0;  };
  function fix_lic(p) { p = _pi(p); var f = {1:4, 3:6, 7:3, 5:2, 13:1, 9:5 }; return (f[p])? f[p]:0;  };

  // get doc details

  var get_doc = function()
  {

    var params = {doc_id:doc_id,extra:"content,original,tag"};

    GM_xmlhttpRequest({
      method: 'POST',
	  url: 'http://'+iol_host+'/api.iol.php/doc.get/json',
	  headers: {
	  //'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
	  'User-agent' : navigator.userAgent,
	  'Accept': 'application/atom+xml,application/xml,text/xml',
	  'Content-Type' : 'application/x-www-form-urlencoded'
	    },

	  data: encode_params(params),

	  onload: function(responseDetails) { get_doc_onApi(responseDetails); },
	  onerror: function(responseDetails) { div.innerHTML="FAILED : please try again later"; }
      });
  };

  // callback

  var get_doc_onApi = function(ajx) {

    try { var rsp = eval('('+ajx.responseText+')'); }
    catch(e) { var rsp = {}; }

    var success = (rsp.status>0)?true:false;

    if (success)
    {
      var doc = rsp.doc;

      photo = { title       : doc.title,
		description : doc.content,
		ispublic    : (doc.share==31)? 1:0,
		isfamily    : (doc.share&1)? 1:0,
		isfriend    : (doc.share&2)? 1:0,
		license     : fix_lic(doc.license),
		latitude    : doc.lat,
		longitude   : doc.lng,
		accuracy    : doc.zoom,
		src         : doc.src_url+"/"+doc.doc_id+"."+doc.ext
      };
      
      if ( doc.keyword_ids )
      {
	var tags = [];
	for(var i=0;i<doc.keyword_ids.length;i++) tags.push(rsp.keywords[doc.keyword_ids[i]]);
	photo.tags = tags.join(',');
      }

      // show doc 

      var table = document.createElement("table");
      var tbody = document.createElement("tbody");
      table.appendChild(tbody);
	  
      var tr  = document.createElement("tr");
      var td1 = document.createElement("td");
      var td2 = document.createElement("td");
      var td3 = document.createElement("td");
	  
      var div_img = document.createElement("img");
      div_img.style.width="25px";
      div_img.style.height="25px";
      div_img.style.marginRight="10px";
      div_img.src=doc.doc_url+'.t.jpg';
	  
      td1.appendChild(div_img);
	  
      var div_link = document.createElement("a");
      div_link.href="#";
      div_link.style.display="block";
      div_link.style.fontSize="13px";
      div_link.style.fontWeight="bold";
      div_link.innerHTML="Import this photo into your Yahoo/Flickr photostream";
	  
      div_link.addEventListener('click', function() { send_photo();}, true);
	  
      td2.appendChild(div_link);
	  
      var div_info = document.createElement("span");
      div_info.style.fontSize="12px";
      div_info.innerHTML = "original photo, title, description, tags and shares will be imported";
	  
      td2.appendChild(div_info);

      var div_ver = document.createElement("a");
      div_ver.href="http://"+iol_host+about.updates;
      div_ver.style.fontSize="11px";
      div_ver.innerHTML="v "+about.version;
      div_ver.style.marginLeft="20px";

      td3.appendChild(div_ver);

      tr.appendChild(td1);
      tr.appendChild(td2); 
      tr.appendChild(td3); 
      tbody.appendChild(tr);

      div.innerHTML='';
      div.appendChild(table);
    }
    else
    {
      div.innerHTML="Call to API failed";
    }
  };

  // 
  // send_photo
  // 

  function send_photo() {

    div.innerHTML="Importing Photo is not supported by flickr";
    
    return;

    // TODO : change here when appropriate method exists at yahoo/flickr

    GM_xmlhttpRequest({
      method: 'POST',
	  url: 'http://www.flickr.com/api/rest',
	  headers: {
	  'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
	    'Accept': 'application/atom+xml,application/xml,text/xml',
	    'Content-Type' : 'application/x-www-form-urlencoded'
	    },
	  
	  data: encode_params(photo),
	  
	  onload: function(responseDetails) { send_photo_status(responseDetails); },
	  onerror: function(responseDetails) { div.innerHTML="FAILED : please try again later"; }
      });
  };

  function send_photo_status(ajx) {
  
    // TODO : callback 
  
  }


  //
  // UTF8 encoding stuff
  //

  function encode_params(params,scope) {
    
    var post = '';
    if  ( params instanceof Array )
      {
	for(var k=0;k<params.length;k++)
	  {
	    var v = params[k];
	    if ( typeof v == "object" ||
		 typeof v == "array" ) post += '&'+encode_params(v,scope?scope+'['+k+']':k);
	    
	    else if ( scope )
	      {
		post += '&'+scope+'['+k+']='+escape_utf8(v);
	      }
	    else
	      {
		post += '&'+k+'='+escape_utf8(v);
	      }
	  }
      }
    else if ( params instanceof Object )
      {
	for(var k in params)
	  {
	    var v = params[k];
	    if ( typeof v == "object" ||
		 typeof v == "array" ) post += '&'+encode_params(v,scope?scope+'['+k+']':k);
	    
	    else if ( scope )
	      {
		post += '&'+scope+'['+k+']='+escape_utf8(v);
	      }
	    else
	      {
		post += '&'+k+'='+escape_utf8(v);
	      }
	  }
      }
    return post.substr(1,post.length);
  }

  function escape_utf8(str) {
    if ( str=="0" ) return 0;
    if ( str==""||str==null||! str) { return ""; }
    
    str = str.toString();
    
    // encode in UTF-8
    
    var c, s;
    var enc = "";
    var i = 0;
    while(i<str.length) {
	c= str.charCodeAt(i++);

	// handle UTF-16 surrogates
	if (c>=0xDC00 && c<0xE000) continue;
	if (c>=0xD800 && c<0xDC00) {
	    if (i>=str.length) continue;
	    s= str.charCodeAt(i++);
	    if (s<0xDC00 || c>=0xDE00) continue;
	    c= ((c-0xD800)<<10)+(s-0xDC00)+0x10000;
	}
	// output value
	if (c<0x80) enc += String.fromCharCode(c);
	else if (c<0x800) enc += String.fromCharCode(0xC0+(c>>6),0x80+(c&0x3F));
	else if (c<0x10000) enc += String.fromCharCode(0xE0+(c>>12),0x80+(c>>6&0x3F),0x80+(c&0x3F));
	else enc += String.fromCharCode(0xF0+(c>>18),0x80+(c>>12&0x3F),0x80+(c>>6&0x3F),0x80+(c&0x3F));
    }

    // encode URI

    var okURIchars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

    str = enc;
    enc = "";

    for (var i= 0; i<str.length; i++) {
	if (okURIchars.indexOf(str.charAt(i))==-1)
	    enc += "%"+to_hex(str.charCodeAt(i));
	else
	    enc += str.charAt(i);
    }
    return enc;
}

  function to_hex(n) {
    var hexchars = "0123456789ABCDEF";
    return hexchars.charAt(n>>4)+hexchars.charAt(n & 0xF);
  }

  // check update

  function check_update(about) {

    var host = 'http://'+iol_host;

    GM_xmlhttpRequest({
      method: 'GET',
	  url: host + about.check+'?'+(new Date().getTime()),

	  onload: function(result) { 
	    var v = parseFloat(result.responseText);
	    if ( about.version != v )
	    {
	      if ( confirm("Please update " + about.name + " to version "+v) )
		document.location = host + about.updates;
	    }
	}
      });
  }

   // check session

  function check_session() {

    var url = 'http://'+iol_host+'/api.iol.php/session.refresh/json';

    var msg = "Sorry, we couldn't check that you have an alive session on ipernity.\nPlease open a browser window or tab on ipernity.com and make sure you're signed in.";

    GM_xmlhttpRequest({
      method: 'POST',
	  url: url,
	       headers: {
	  'Accept': 'application/atom+xml,application/xml,text/xml',
	    'Content-Type' : 'application/x-www-form-urlencoded'
	    },

	  onload: function(ajx) {
	  try { var rsp = eval('('+ajx.responseText+')'); }
	  catch(e) { var rsp = {}; }
	  var success = (rsp.status>0)?true:false;
	  if ( ! success ) { alert(msg); }
	  else { 
	    // session is ok
	  }
	},
	  onerror: function(ajx) { alert(msg); }
      });
  }

  //
  // start
  //

  get_doc();


 }) ();



