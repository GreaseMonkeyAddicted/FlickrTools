// Flickr2ipernity.invite v1.3
// http://www.ipernity.com/apps/

// ==UserScript==
// @name            Flickr2ipernity.invite
// @version         1.3
// @description     Send FlickrMails to your Flickr contacts
// @include         http://www.flickr.com/people/*/contacts*
// @include         http://flickr.com/people/*/contacts*
// @include         https://www.flickr.com/people/*/contacts*
// @include         https://flickr.com/people/*/contacts*
// @exclude         http://www.flickr.com/people/*/contacts/ignore*
// @exclude         http://flickr.com/people/*/contacts/ignore*
// @exclude         https://www.flickr.com/people/*/contacts/ignore*
// @exclude         https://flickr.com/people/*/contacts/ignore*
// @grant           GM_xmlhttpRequest
// @grant           GM_getValue
// @grant           GM_setValue
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
// select "flickr2ipernity_invite", and click Uninstall.
//
// Thanks to :
// - http://gdorn.nudio.net/greasemonkey
//
// --------------------------------------------------------------------

/*
 ChangeLog
 =========
 v1.1  20-June-2014 : first release....
 v1.2  27-June-2014 : keep panel opened across pages
 v1.3  28-July-2014 : add grant for GM_xmlhttpRequest
 */

(function() {

  <!--common.js-->

  var about = { 'name': 'Flickr2ipernity.invite',
    'script': 'flickr.messenger',
    'version': '1.3' };

  console.info(about.name+": script loading...");

  var subjectText = "Ever heard of ipernity?";
  var messageText = "Hello!\n\n";
  messageText += "Since the big changes here, I'm on ipernity now.\nNice layout and great features.\n\n";
  messageText += "Have a look at my gallery:\n";
  messageText += "%sponsor_link%\n\n";
  messageText += "I have found some of my friends there.\n";
  messageText += "You might want to think about it too\n\n";
  messageText += "Catch you soon!\n";

  var magic_cookie = w.F.config.flickr.magic_cookie;
  var selectedRecipients = {};
  var nbSelectedRecipients = 0;
  var div;
  var messages_sent = 0;
  var force_display = GM_getValue("force_display", 0);

  // check update and session

  check_update();
  check_session();

  // say hello

  document.title = document.title+" ["+about.name+" v"+about.version+"]";

  // our div

  function processRecipients(fromClick) {

    var sent = false;
    for (var recNSID in selectedRecipients) {
      if (selectedRecipients.hasOwnProperty(recNSID)) {

        sendFlickrMail(recNSID, (function(recNSID){
          return function() {
            messages_sent++;
            _ge('iper_messenger_count_value').innerHTML = messages_sent;

            var cell = _ge('iper_cb_'+recNSID).parentNode;
            cell.innerHTML = '<span style="color: #00800d; font-weight: bold;">sent</span>';

            setTimeout(processRecipients, 2000);
          }
        })(recNSID));

        delete selectedRecipients[recNSID];
        sent = true;
        break;
      }
    }

    if (!sent) {
      _ge('iper_messenger_submit').disabled=false;
    }

    if (fromClick) {
      if (!sent) {
        confirm("Please select contacts in your contacts list.");
      }
      else {
        _ge('iper_messenger_total_value').innerHTML = nbSelectedRecipients;
        _ge('iper_messenger_count').style.display = 'block';
      }
    }

    return false;
  }

  function onClickDisplay(el) {

    if (div.style.display == "none") {
      create_checkboxes();

      loadIperSponsorLink(function(){
        messageText = messageText.replace("%sponsor_link%", getIperSponsorLink());
        _ge('iper_message').value = messageText;

        div.style.display = "block";
      });

      GM_setValue("force_display", 1);
    }

    el.remove();
  }

  function closeScript() {
    delete_checkboxes();
    div.remove();

    GM_setValue("force_display", 0);
  }

  function create_div() {
    div = document.createElement("DIV");
    div.id = "iol_messenger";
    div.style.backgroundColor="#fafafa";
    div.style.padding="10px";
    div.style.margin="20px 0";
    div.style.display = "none";
    div.style.position = "relative";


    // Click to display form
    var clickToDisplay = document.createElement("A");
    clickToDisplay.id="iol_launch_script";
    clickToDisplay.href = "#";
    clickToDisplay.innerHTML = "Invite to ipernity";

    var spanNew = document.createElement("SPAN");
    spanNew.style.font = "normal 8px verdana,arial,sans-serif";
    spanNew.style.textTransform = "uppercase";
    spanNew.style.color = "#000";
    spanNew.style.backgroundColor = "#ffe288";
    spanNew.style.padding = "1px";
    spanNew.style.verticalAlign = "middle";
    spanNew.style.marginLeft = "5px";
    spanNew.innerHTML = "NEW";
    clickToDisplay.appendChild(spanNew);

    clickToDisplay.onclick = function(){onClickDisplay(this); return false;};

    if (_ge('Main')) {
      var last = _ge('Main').getElementsByTagName('div')[0];
      _ge('Main').insertBefore(div, last);
    }
    else {
      var body = getElementsByTagName('body')[0];
      body.insertBefore(div, body.lastChild);
    }


    if (_ge('contacts-subnav') && _ge('contacts-subnav').getElementsByTagName('a')) {
      var links = _ge('contacts-subnav').getElementsByTagName('a');
      var lastA = links[links.length-1];
      var spanForLastA = document.createElement("SPAN");
      lastA.parentNode.insertBefore(spanForLastA, lastA);
      spanForLastA.appendChild(lastA);

      spanForLastA.parentNode.appendChild(clickToDisplay);
    }
    else {
      var body = getElementsByTagName('body')[0];
      body.insertBefore(clickToDisplay, div);
    }


    var formHTML = '<a href="#" id="iol_messenger_close" style="position: absolute; top: 20px; right: 15px; font-size: 12px">Close</a>';
    formHTML += '<p style="font-weight: bold;">Invite your contacts to discover and join ipernity!</p>';
    formHTML += "<p>This message will be sent to contacts you've selected below.</p>";
    formHTML += '<form id="iper_messenger" onsubmit="return false;">';
    formHTML += '<input id="iper_subject" type="text" style="width: 400px;" value="'+subjectText+'" tabindex="1" class="compose-field">';
    formHTML += '<textarea id="iper_message" style="width: 400px; margin-top: 10px;" rows="13" wrap="virtual" tabindex="2" class="compose-field"></textarea>';
    formHTML += '<br><input id="iper_messenger_submit" type="submit" class="Butt" value="SEND MESSAGE" tabindex="3" style="margin-top: 15px;">';
    formHTML += '</form>';
    formHTML += '<p id="iper_messenger_count" style="display: none;">Sent messages: <span id="iper_messenger_count_value">'+messages_sent+'</span>&#47;<span id="iper_messenger_total_value"></span></p>';

    div.innerHTML = formHTML;


    // bouton close
    _ge('iol_messenger_close').onclick = function(){closeScript(); return false;};

    _ge('iper_messenger_submit').onclick = function(){
      this.disabled=true;
      processRecipients(true);
      return false;
    };

  }

  create_div();
  if (force_display == 1) {
    onClickDisplay(_ge("iol_launch_script"));
  }

  function onClickCheckbox(el) {

    var destNSID = el.getAttribute("data-nsid");
    if (el.checked) {
      selectedRecipients[destNSID] = 1;
      nbSelectedRecipients++;
    }
    else {
      delete selectedRecipients[destNSID];
      nbSelectedRecipients--;
    }

    return true;
  }

  function create_checkboxes() {
    var contactListTable = _ge('Main').getElementsByClassName('contact-list-table')[0];

    var headerRow = contactListTable.getElementsByTagName('thead')[0].getElementsByTagName('tr')[0];
    var newCell = document.createElement("TH");
    newCell.style.color = "#1057ae";
    newCell.innerHTML = "Select";
    headerRow.insertBefore(newCell, headerRow.getElementsByTagName('th')[0]);

    var contactListRows = contactListTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    var nbRows = contactListRows.length;
    for (var i = 0; i < nbRows; i++) {
      var row = contactListRows[i];

      var firstCell = row.getElementsByTagName('td')[0];
      var newCell = document.createElement("TD");
      var checkbox = document.createElement("INPUT");
      checkbox.type = "checkbox";
      checkbox.onclick = function(){return onClickCheckbox(this);};

      newCell.appendChild(checkbox);

      row.insertBefore(newCell, firstCell);

      var contactData = newCell.parentNode.getElementsByClassName('contact-list-youthem')[0].getElementsByTagName('span')[0].id;
      var res = contactData.split("_");
      var recNSID = res[res.length-1];
      checkbox.setAttribute("data-nsid", recNSID);
      checkbox.setAttribute("id", "iper_cb_"+recNSID);
    }
  }

  function delete_checkboxes() {
    var contactListTable = _ge('Main').getElementsByClassName('contact-list-table')[0];

    var headerRow = contactListTable.getElementsByTagName('thead')[0].getElementsByTagName('tr')[0];
    headerRow.getElementsByTagName('th')[0].remove();

    var contactListRows = contactListTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    var nbRows = contactListRows.length;
    for (var i = 0; i < nbRows; i++) {
      var row = contactListRows[i];
      row.getElementsByTagName('td')[0].remove();
    }
  }

  function sendFlickrMail(toNSID, callback) {

    var params = {
      'magic_cookie': magic_cookie,
      'to'          : toNSID,
      'to_nsid'     : toNSID,
      'reply'       : "",
      'done'        : "1",
      'subject'     : _ge('iper_subject').value,
      'message'     : _ge('iper_message').value
    };

    GM_xmlhttpRequest({
      method: 'POST',
      url: "https://www.flickr.com/mail/write",
      headers: {
        'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
        'Accept': 'application/atom+xml,application/xml,text/xml',
        'Content-Type' : 'application/x-www-form-urlencoded'
      },
      data: encode_params(params),
      onload: function(ajx) {
        console.log(ajx);
        callback();
      },
      onerror: function(ajx) {
        console.log('onError', ajx);
        console.warn(ajx);
      }
    });
  }



  // (c) flickr

  var escape_utf8=function(s)
  {
    if(s===0) { return "0"; }
    if(s===""||s===null) { return ""; }

    s=s.toString();

    if(s.match(/^[\s\n\r\t]+$/)) return "";

    var r="";
    for(var i=0;i<s.length;i++)
    {
      var c=s.charCodeAt(i);
      var bs=new Array();
      if(c>65536)
      {
        bs[0]=240|((c&1835008)>>>18);bs[1]=128|((c&258048)>>>12);bs[2]=128|((c&4032)>>>6);bs[3]=128|(c&63);
      }
      else
      {
        if(c>2048)
        {
          bs[0]=224|((c&61440)>>>12);bs[1]=128|((c&4032)>>>6);bs[2]=128|(c&63);
        }
        else
        {
          if(c>128)
          {
            bs[0]=192|((c&1984)>>>6);bs[1]=128|(c&63);
          }
          else
          {
            bs[0]=c;
          }

        }

      }
      if(bs.length>1)
      {
        for(var j=0;j<bs.length;j++)
        {
          var b=bs[j];
          var hex=nibble_to_hex((b&240)>>>4)+nibble_to_hex(b&15);r+="%"+hex;
        }

      }
      else
      {
        r+=encodeURIComponent(String.fromCharCode(bs[0]));
      }

    }
    return r;
  };

  var nibble_to_hex=function(s)
  {
    var h="0123456789ABCDEF";
    return h.charAt(s);
  };

}) ();



