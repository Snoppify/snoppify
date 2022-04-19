/**
 *  see https://stackoverflow.com/a/32841043
 */
export default function getIP() {
  return new Promise((resolve) => {
    // compatibility for Firefox and chrome
    window.RTCPeerConnection =
      window.RTCPeerConnection ||
      window.mozRTCPeerConnection ||
      window.webkitRTCPeerConnection;

    const pc = new RTCPeerConnection({
      iceServers: [],
    });
    const noop = () => {};

    // create a bogus data channel
    pc.createDataChannel("");

    // create offer and set local description
    pc.createOffer(pc.setLocalDescription.bind(pc), noop);
    pc.onicecandidate = function onicecandidate(ice) {
      if (ice && ice.candidate && ice.candidate.candidate) {
        const myIP =
          /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(
            ice.candidate.candidate,
          )[1];
        pc.onicecandidate = noop;

        resolve(myIP);
      }
    };
  });
}
