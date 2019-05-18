/**
 *  see https://stackoverflow.com/a/32841043
 */
export default function getIP() {
    return new Promise((resolve, reject) => {
        //compatibility for Firefox and chrome
        window.RTCPeerConnection =
            window.RTCPeerConnection ||
            window.mozRTCPeerConnection ||
            window.webkitRTCPeerConnection;

        var pc = new RTCPeerConnection({
                iceServers: [],
            }),
            noop = function() {};

        //create a bogus data channel
        pc.createDataChannel("");

        // create offer and set local description
        pc.createOffer(pc.setLocalDescription.bind(pc), noop);
        pc.onicecandidate = function(ice) {
            if (ice && ice.candidate && ice.candidate.candidate) {
                var myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(
                    ice.candidate.candidate,
                )[1];
                pc.onicecandidate = noop;

                resolve(myIP);
            }
        };
    });
}
