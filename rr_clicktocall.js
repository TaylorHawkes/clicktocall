
    var sip_oSipStack, sip_oSipSessionRegister, sip_oSipSessionCall, sip_oSipSessionTransferCall;
    var sip_videoRemote, ivr_videoLocal, ivr_audioRemote;
    var ivr_bFullScreen = false;
    var ivr_oNotifICall;
    var bDisableVideo = false;
    var viewVideoLocal, viewVideoRemote; // <video> (webrtc) or <div> (webrtc4all)
    var oConfigCall;
    var oReadyStateTimer;
    var click_to_call_status;
    var click_to_call;
    var click_to_call_controls;
    var sip_call_id;

    C = { divKeyPadWidth: 220 };


    window.addEventListener("load", ivr_click_to_call_init, false); 
    function ivr_click_to_call_init(){
        document.addEventListener("keyup", function (evt) {
             if(click_to_call_status =="started"){
                sipSendDTMF(String.fromCharCode(evt.keyCode));
            }

        });

        ui_click_to_call();
        ivr_audioRemote = document.getElementById("ivrd_audio_remote");
        SIPml.init(ivr_postInit,initError);
    };

    function initError(){
        click_to_call.innerHTML=click_to_call.getAttribute('notsupported_text');
    } 
   
    function ui_click_to_call(){
        click_to_call = document.getElementById("ringroost_c2c");
        var click_html='<div id="rr_c2c_controls"><a href="#" onclick="ivrDesignerCall();">'+click_to_call.getAttribute("text")+'</a></div><div id="rr_phone_status"></div><span id="rr_call_icon">&#9742;</span>';
        click_html+='<audio style="display:none" id="ivrd_audio_remote" autoplay="autoplay" /></audio>';
        click_html+='<audio  style="display:none" id="ivrd_dtmfTone" src="//www.ringroost.com/dtmf.wav" /></audio>';
        click_to_call.innerHTML = click_html; 
        click_to_call_controls=document.getElementById("rr_c2c_controls");
        txtCallStatus =document.getElementById("rr_phone_status");
    }

    function getChromeVersion () {     
        var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
        return raw ? parseInt(raw[2], 10) : false;
    }

    function ivr_postInit() {

    var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
    var is_explorer = (navigator.userAgent.indexOf('MSIE') > -1 || (!!document.documentMode == true ));
    var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
    var is_safari = navigator.userAgent.indexOf("Safari") > -1 ;
    var is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
    if ((is_chrome)&&(is_safari)) {is_safari=false;}
    if ((is_chrome)&&(is_opera)) {is_chrome=false;} 

    if(is_chrome){
        if(getChromeVersion() > 46 && location.protocol === 'http:'){
            initError();
            return;
        };
    }
    //will they be able to handle this??
    if (!SIPml.isWebRtcSupported() || !SIPml.isWebSocketSupported() ){
        initError();
        return;
    }
    //safari && and ie don't currently work
    if (is_safari || is_explorer){
        initError();
        return;
    }
        // FIXME: displays must be per session
        document.body.style.cursor = 'default';
        oConfigCall = {
            audio_remote: ivr_audioRemote,
           // video_local: viewVideoLocal,
           // video_remote: viewVideoRemote,
            bandwidth: { audio:undefined },
            //video_size: { minWidth:undefined, minHeight:undefined, maxWidth:undefined, maxHeight:undefined },
            events_listener: { events: '*', listener: onSipEventSession },
            sip_caps: [
                            { name: '+g.oma.sip-im' },
                            { name: '+sip.ice' },
                            { name: 'language', value: '\"en,fr\"' }
                        ]
        };
}


function ivrDesignerCall(){
    sip_call_id=click_to_call.getAttribute("call");
    ivr_sipRegister();
}

function sip_onSipEventStack(e /*SIPml.Stack.Event*/) {
        tsk_utils_log_info('==stack event = ' + e.type);
        switch (e.type) {
            case 'started':
                {
                        //we start the call as sson as we are started
                        ivr_sipCall("call-audio");
                        return;
                        //we dont need to register
                    // catch exception for IE (DOM not ready)
                    try {
                        
                        // LogIn (REGISTER) as soon as the stack finish starting
                        sip_oSipSessionRegister = this.newSession('register', {
                            expires: 200,
                            events_listener: { events: '*', listener: onSipEventSession },
                            sip_caps: [
                                        { name: '+g.oma.sip-im', value: null },
                                        { name: '+audio', value: null },
                                        { name: 'language', value: '\"en,fr\"' }
                                ]
                        });
                        sip_oSipSessionRegister.register();
                    }
                    catch (e) {
                       // txtRegStatus.value = txtRegStatus.innerHTML = "<b>1:" + e + "</b>";
                    }
                    break;
                }
            case 'stopping': case 'stopped': case 'failed_to_start': case 'failed_to_stop':
                {

                    var bFailure = (e.type == 'failed_to_start') || (e.type == 'failed_to_stop');
                    sip_oSipStack = null;
                    sip_oSipSessionRegister = null;
                    sip_oSipSessionCall = null;
                    stopRingbackTone();
                    stopRingTone();


                    txtCallStatus.innerHTML = '';
                    //txtRegStatus.innerHTML = bFailure ? "<i>Disconnected: <b>" + e.description + "</b></i>" : "<i>Disconnected</i>";
                    break;
                }

            case 'i_new_call':
                {
                    if (sip_oSipSessionCall) {
                        // do not accept the incoming call if we're already 'in call'
                        e.newSession.hangup(); // comment this line for multi-line support
                    }
                    else {
                        sip_oSipSessionCall = e.newSession;
                        // start listening for events
                        sip_oSipSessionCall.setConfiguration(oConfigCall);


                        startRingTone();

                        var sRemoteNumber = (sip_oSipSessionCall.getRemoteFriendlyName() || 'unknown');
                        txtCallStatus.innerHTML = "<i>Incoming call from [<b>" + sRemoteNumber + "</b>]</i>";
                        showNotifICall(sRemoteNumber);
                    }
                    break;
                }

            case 'm_permission_requested':
                {
                    //divGlassPanel.style.visibility = 'visible';
                    break;
                }
            case 'm_permission_accepted':
            case 'm_permission_refused':
                {
                    //divGlassPanel.style.visibility = 'hidden';
                    if(e.type == 'm_permission_refused'){
                    }
                    break;
                }

            case 'starting': default: break;
        }
    };

    //tay
    function ivr_sipRegister() {
            if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
                window.webkitNotifications.requestPermission();
            }

            SIPml.setDebugLevel("info"); //info || error

            // create SIP stack
            sip_oSipStack = new SIPml.Stack({
                    realm: 'ivrdesigner.com',
                    impi: sip_call_id,
                    impu: 'sip:clicktocall@ivrdesigner.com',
                    password: 'none',
                    display_name: 'ivr_plugin',
                    websocket_proxy_url:'wss://ivrdesigner.com:10062',
                    outbound_proxy_url:null ,
                    ice_servers:"[{url:'stun:stun.l.google.com:19302'}]", 
                    enable_rtcweb_breaker:true ,
                    events_listener: { events: '*', listener: sip_onSipEventStack }, //check this out tal
                    enable_early_ims: true,
                    enable_media_stream_cache: false,
                    bandwidth: null,
                    video_size: null,
                    sip_headers: [
                            { name: 'User-Agent', value: 'IM-client/OMA1.0 sipML5-v1.2014.04.18' },
                            { name: 'Organization', value: 'Doubango Telecom' }
                    ]
                }
            );

            if (sip_oSipStack.start() != 0) {
                return false;
            } else {
                //were good
                return true;
            }
    }

    // sends SIP REGISTER (expires=0) to logout
    function sipUnRegister() {
        if (sip_oSipStack) {
            sip_oSipStack.stop(); // shutdown all sessions
        }
    }

    // makes a call (SIP INVITE)
    function ivr_sipCall(s_type) {
        /*if (!sip_oSipSessionCall) {*/
            // create call session
            sip_oSipSessionCall = sip_oSipStack.newSession(s_type, oConfigCall);
            // make call
            if (sip_oSipSessionCall.call(sip_call_id) != 0) {
                return;
            }else{
                return;
            }
            /*
        incomming calls
        }else{
            alert('accepting inbound session');
            sip_oSipSessionCall.accept(oConfigCall);
        }
        */
    }

    

    // terminates the call (SIP BYE or CANCEL)
    function sipHangUp() {
        if (sip_oSipSessionCall) {
            txtCallStatus.innerHTML = '<i>Terminating the call...</i>';
            sip_oSipSessionCall.hangup({events_listener: { events: '*', listener: onSipEventSession }});
        }
    }

    function sipSendDTMF(c){
        if(sip_oSipSessionCall && c){
            if(sip_oSipSessionCall.dtmf(c) == 0){
                try { ivrd_dtmfTone.play(); } catch(e){ }
            }
        }
    }
    function ivr_insertAfter(referenceNode, newNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function startRingTone() {
        try { ringtone.play(); }
        catch (e) { }
    }

    function stopRingTone() {
        try { ringtone.pause(); }
        catch (e) { }
    }

    function startRingbackTone() {
        try { ringbacktone.play(); }
        catch (e) { }
    }

    function stopRingbackTone() {
        try { ringbacktone.pause(); }
        catch (e) { }
    }

    function toggleFullScreen() {
        if (sip_videoRemote.webkitSupportsFullscreen) {
            fullScreen(!sip_videoRemote.webkitDisplayingFullscreen);
        }
        else {
            fullScreen(!ivr_bFullScreen);
        }
    }

    function openKeyPad(){
        divKeyPad.style.visibility = 'visible';
        divKeyPad.style.left = ((document.body.clientWidth - C.divKeyPadWidth) >> 1) + 'px';
        divKeyPad.style.top = '70px';
        //divGlassPanel.style.visibility = 'visible';
    }

    function closeKeyPad(){
        divKeyPad.style.left = '0px';
        divKeyPad.style.top = '0px';
        divKeyPad.style.visibility = 'hidden';
        //divGlassPanel.style.visibility = 'hidden';
    }

    function fullScreen(b_fs) {
        ivr_bFullScreen = b_fs;
        if (tsk_utils_have_webrtc4native() && ivr_bFullScreen && sip_videoRemote.webkitSupportsFullscreen) {
            if (ivr_bFullScreen) {
                sip_videoRemote.webkitEnterFullScreen();
            }
            else {
                sip_videoRemote.webkitExitFullscreen();
            }
        }
        else {
            if (tsk_utils_have_webrtc4npapi()) {
                try { if(window.__o_display_remote) window.__o_display_remote.setFullScreen(b_fs); }
                catch (e) { divVideo.setAttribute("class", b_fs ? "full-screen" : "normal-screen"); }
            }
            else {
                divVideo.setAttribute("class", b_fs ? "full-screen" : "normal-screen");
            }
        }
    }

    function showNotifICall(s_number) {
        // permission already asked when we registered
        if (window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) {
            if (ivr_oNotifICall) {
                ivr_oNotifICall.cancel();
            }
            ivr_oNotifICall = window.webkitNotifications.createNotification('images/sipml-34x39.png', 'Incaming call', 'Incoming call from ' + s_number);
            ivr_oNotifICall.onclose = function () { ivr_oNotifICall = null; };
            ivr_oNotifICall.show();
        }
    }

    /*
    function onKeyUp(evt) {
        if(click_to_call_status =="started"){
            sipSendDTMF(String.fromCharCode(evt.keyCode));
        }
    }
    */

    function onDivCallCtrlMouseMove(evt) {
        try { // IE: DOM not ready
            if (tsk_utils_have_stream()) {
                document.getElementById("divCallCtrl").onmousemove = null; // unsubscribe
            }
        }
        catch (e) { }
    }

    
    // Callback function for SIP sessions (INVITE, REGISTER, MESSAGE...)
    function onSipEventSession(e /* SIPml.Session.Event */) {
        tsk_utils_log_info('==session event = ' + e.type);

        switch (e.type) {
            case 'connecting': case 'connected':
                {
                    txtCallStatus.style.display='block';
                    var bConnected = (e.type == 'connected');
                    if (e.session == sip_oSipSessionRegister) {
                        //txtRegStatus.innerHTML = "<i>" + e.description + "</i>";
                    }
                    else if (e.session == sip_oSipSessionCall) {

                        if (bConnected) {
                            click_to_call_status='started';
                            click_to_call_controls.innerHTML = '<a href="#" onclick="sipHangUp();">Hangup</a>'; 
                            stopRingbackTone();
                            stopRingTone();

                            if (ivr_oNotifICall) {
                                ivr_oNotifICall.cancel();
                                ivr_oNotifICall = null;
                            }
                        }

                        txtCallStatus.innerHTML = "<i>" + e.description + "</i>";

                    }
                    break;
                } // 'connecting' | 'connected'
            case 'terminating': case 'terminated':
                {

                    click_to_call_status='stopped';
                    txtCallStatus.style.display='none';
                    click_to_call_controls.innerHTML = '<a href="#" onclick="ivrDesignerCall();"> '+click_to_call.getAttribute("text")+' </a>'; 
                    if (e.session == sip_oSipSessionRegister) {

                        sip_oSipSessionCall = null;
                        sip_oSipSessionRegister = null;
                        txtCallStatus.innerHTML =  e.description; 
                        //txtRegStatus.innerHTML = "<i>" + e.description + "</i>";
                    }
                    else if (e.session == sip_oSipSessionCall) {
                        txtCallStatus.innerHTML = e.description; 
                    }
                    break;
                } // 'terminating' | 'terminated'

            case 'm_stream_video_local_added':
                {
                    if (e.session == sip_oSipSessionCall) {
                    }
                    break;
                }
            case 'm_stream_video_local_removed':
                {
                    if (e.session == sip_oSipSessionCall) {
                    }
                    break;
                }
            case 'm_stream_video_remote_added':
                {
                    if (e.session == sip_oSipSessionCall) {
                    }
                    break;
                }
            case 'm_stream_video_remote_removed':
                {
                    if (e.session == sip_oSipSessionCall) {
                    }
                    break;
                }

            case 'm_stream_audio_local_added':
            case 'm_stream_audio_local_removed':
            case 'm_stream_audio_remote_added':
            case 'm_stream_audio_remote_removed':
                {
                    break;
                }

            case 'i_ect_new_call':
                {
                    sip_oSipSessionTransferCall = e.session;
                    break;
                }

            case 'i_ao_request':
                {
                    if(e.session == sip_oSipSessionCall){
                        var iSipResponseCode = e.getSipResponseCode();
                        if (iSipResponseCode == 180 || iSipResponseCode == 183) {
                            startRingbackTone();
                            txtCallStatus.innerHTML = '<i>Remote ringing...</i>';
                        }
                    }
                    break;
                }

            case 'm_early_media':
                {
                    if(e.session == sip_oSipSessionCall){
                        stopRingbackTone();
                        stopRingTone();
                        txtCallStatus.innerHTML = '<i>Early media started</i>';
                    }
                    break;
                }

            case 'm_local_hold_ok':
                {
                    if(e.session == sip_oSipSessionCall){
                        if (sip_oSipSessionCall.bTransfering) {
                            sip_oSipSessionCall.bTransfering = false;
                            // this.AVSession.TransferCall(this.transferUri);
                        }
                        btnHoldResume.value = 'Resume';
                        btnHoldResume.disabled = false;
                        txtCallStatus.innerHTML = '<i>Call placed on hold</i>';
                        sip_oSipSessionCall.bHeld = true;
                    }
                    break;
                }
            case 'm_local_hold_nok':
                {
                    if(e.session == sip_oSipSessionCall){
                        sip_oSipSessionCall.bTransfering = false;
                        btnHoldResume.value = 'Hold';
                        btnHoldResume.disabled = false;
                        txtCallStatus.innerHTML = '<i>Failed to place remote party on hold</i>';
                    }
                    break;
                }
            case 'm_local_resume_ok':
                {
                    if(e.session == sip_oSipSessionCall){
                        sip_oSipSessionCall.bTransfering = false;
                        btnHoldResume.value = 'Hold';
                        btnHoldResume.disabled = false;
                        txtCallStatus.innerHTML = '<i>Call taken off hold</i>';
                        sip_oSipSessionCall.bHeld = false;

                        if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback yet
                        }
                    }
                    break;
                }
            case 'm_local_resume_nok':
                {
                    if(e.session == sip_oSipSessionCall){
                        sip_oSipSessionCall.bTransfering = false;
                        btnHoldResume.disabled = false;
                        txtCallStatus.innerHTML = '<i>Failed to unhold call</i>';
                    }
                    break;
                }
            case 'm_remote_hold':
                {
                    if(e.session == sip_oSipSessionCall){
                        txtCallStatus.innerHTML = '<i>Placed on hold by remote party</i>';
                    }
                    break;
                }
            case 'm_remote_resume':
                {
                    if(e.session == sip_oSipSessionCall){
                        txtCallStatus.innerHTML = '<i>Taken off hold by remote party</i>';
                    }
                    break;
                }

            case 'o_ect_trying':
                {
                    if(e.session == sip_oSipSessionCall){
                        txtCallStatus.innerHTML = '<i>Call transfer in progress...</i>';
                    }
                    break;
                }
            case 'o_ect_accepted':
                {
                    if(e.session == sip_oSipSessionCall){
                        txtCallStatus.innerHTML = '<i>Call transfer accepted</i>';
                    }
                    break;
                }
            case 'o_ect_completed':
            case 'i_ect_completed':
                {
                    if(e.session == sip_oSipSessionCall){
                        txtCallStatus.innerHTML = '<i>Call transfer completed</i>';
                        if (sip_oSipSessionTransferCall) {
                            sip_oSipSessionCall = sip_oSipSessionTransferCall;
                        }
                        sip_oSipSessionTransferCall = null;
                    }
                    break;
                }
            case 'o_ect_failed':
            case 'i_ect_failed':
                {
                    if(e.session == sip_oSipSessionCall){
                        txtCallStatus.innerHTML = '<i>Call transfer failed</i>';
                    }
                    break;
                }
            case 'o_ect_notify':
            case 'i_ect_notify':
                {
                    if(e.session == sip_oSipSessionCall){
                        txtCallStatus.innerHTML = "<i>Call Transfer: <b>" + e.getSipResponseCode() + " " + e.description + "</b></i>";
                        if (e.getSipResponseCode() >= 300) {
                            if (sip_oSipSessionCall.bHeld) {
                                sip_oSipSessionCall.resume();
                            }
                        }
                    }
                    break;
                }
            case 'i_ect_requested':
                {
                    if(e.session == sip_oSipSessionCall){                        
                        var s_message = "Do you accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?";//FIXME
                        if (confirm(s_message)) {
                            txtCallStatus.innerHTML = "<i>Call transfer in progress...</i>";
                            sip_oSipSessionCall.acceptTransfer();
                            break;
                        }
                        sip_oSipSessionCall.rejectTransfer();
                    }
                    break;
                }
        }
    }

    //init the button



